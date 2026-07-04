using System;
using System.Collections.Generic;
using System.Windows.Forms;

namespace Biokey01
{
    public partial class Form1
    {
        private const string BridgeServiceName = "RecordIT Fingerprint Bridge";
        private const string BridgeVersion = "0.2.0";
        private const string MockStudentId = "REC-MOCK-001";
        private const string MockStudentName = "Mock Student";
        private const string MockStudentClassName = "RecordIT Demo Class";
        private const string FingerLeft = "left";
        private const string FingerRight = "right";
        private const string StatusIdle = "IDLE";
        private const string StatusWaiting = "WAITING_FOR_FINGER";
        private const string StatusCapturing = "CAPTURING";
        private const string StatusSuccess = "SUCCESS";
        private const string StatusFailed = "FAILED";

        private readonly object bridgeLock = new object();
        private readonly List<string> bridgeLogs = new List<string>();
        private readonly Dictionary<string, StudentRecord> students = new Dictionary<string, StudentRecord>();
        private readonly Dictionary<int, FingerOwner> fpOwners = new Dictionary<int, FingerOwner>();
        private BridgeServer bridgeServer;
        private bool bridgeConnected = false;
        private string bridgeMode = "None";
        private string bridgeMessage = "Bridge starting.";
        private string enrollmentStatus = StatusIdle;
        private string captureStatus = StatusIdle;
        private string verifyStatus = StatusIdle;
        private string identifyStatus = StatusIdle;
        private string capturedTemplate = "";
        private int enrollIndex = 0;
        private int lastQuality = 0;
        private bool verifyMatched = false;
        private bool identifyMatched = false;
        private int identifyFpId = -1;
        private int identifyScore = 0;
        private int identifyProcessedNumber = 0;
        private string activeStudentId = MockStudentId;
        private string activeFinger = FingerLeft;
        private int nextFpId = 1;

        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);
            EnsureMockStudent();
            InstallBridgeEventHandlers();
            StartBridgeServer();
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            if (bridgeServer != null)
            {
                bridgeServer.Dispose();
                bridgeServer = null;
            }

            base.OnFormClosed(e);
        }

        private void InstallBridgeEventHandlers()
        {
            axZKFPEngX1.OnFeatureInfo -= new AxZKFPEngXControl.IZKFPEngXEvents_OnFeatureInfoEventHandler(axZKFPEngX1_OnFeatureInfo);
            axZKFPEngX1.OnImageReceived -= new AxZKFPEngXControl.IZKFPEngXEvents_OnImageReceivedEventHandler(axZKFPEngX1_OnImageReceived);
            axZKFPEngX1.OnEnroll -= new AxZKFPEngXControl.IZKFPEngXEvents_OnEnrollEventHandler(axZKFPEngX1_OnEnroll);
            axZKFPEngX1.OnCapture -= new AxZKFPEngXControl.IZKFPEngXEvents_OnCaptureEventHandler(axZKFPEngX1_OnCapture);

            axZKFPEngX1.OnFeatureInfo += new AxZKFPEngXControl.IZKFPEngXEvents_OnFeatureInfoEventHandler(BridgeOnFeatureInfo);
            axZKFPEngX1.OnImageReceived += new AxZKFPEngXControl.IZKFPEngXEvents_OnImageReceivedEventHandler(axZKFPEngX1_OnImageReceived);
            axZKFPEngX1.OnEnroll += new AxZKFPEngXControl.IZKFPEngXEvents_OnEnrollEventHandler(BridgeOnEnroll);
            axZKFPEngX1.OnCapture += new AxZKFPEngXControl.IZKFPEngXEvents_OnCaptureEventHandler(BridgeOnCapture);
        }

        private void StartBridgeServer()
        {
            try
            {
                bridgeServer = new BridgeServer(this, 5050);
                bridgeServer.Start();
                SetBridgeMessage("Bridge started on http://localhost:5050");
            }
            catch (Exception ex)
            {
                SetBridgeMessage("Bridge failed to start: " + ex.Message);
            }
        }

        private void BridgeOnFeatureInfo(object sender, AxZKFPEngXControl.IZKFPEngXEvents_OnFeatureInfoEvent e)
        {
            axZKFPEngX1_OnFeatureInfo(sender, e);

            lock (bridgeLock)
            {
                lastQuality = axZKFPEngX1.LastQuality;
                bridgeMessage = statusBar1.Panels[0].Text;
                if (bridgeMode == "Enrollment")
                {
                    enrollmentStatus = StatusCapturing;
                    enrollIndex = axZKFPEngX1.EnrollIndex;
                }
                else if (bridgeMode == "CaptureOnly")
                {
                    captureStatus = StatusCapturing;
                }
            }

            AddBridgeLog(statusBar1.Panels[0].Text);
        }

        private void BridgeOnEnroll(object sender, AxZKFPEngXControl.IZKFPEngXEvents_OnEnrollEvent e)
        {
            if (bridgeMode != "Enrollment")
            {
                axZKFPEngX1_OnEnroll(sender, e);
                return;
            }

            StudentRecord student = FindStudent(activeStudentId);
            if (student == null)
            {
                enrollmentStatus = StatusFailed;
                bridgeMode = "None";
                SetBridgeMessage("Register Failed: student not found");
                return;
            }

            FingerTemplate finger = GetFinger(student, activeFinger);
            if (!e.actionResult)
            {
                finger.Status = StatusFailed;
                enrollmentStatus = StatusFailed;
                bridgeMode = "None";
                enrollIndex = 0;
                SetBridgeMessage("Register Failed");
                return;
            }

            sRegTemplate = axZKFPEngX1.GetTemplateAsStringEx("9");
            sRegTemplate10 = axZKFPEngX1.GetTemplateAsStringEx("10");

            if (sRegTemplate.Length == 0 || sRegTemplate10.Length == 0)
            {
                finger.Status = StatusFailed;
                enrollmentStatus = StatusFailed;
                bridgeMode = "None";
                SetBridgeMessage("Register Failed: template length is zero");
                return;
            }

            if (finger.FpId == 0)
            {
                finger.FpId = nextFpId;
                nextFpId++;
            }

            finger.Template9 = sRegTemplate;
            finger.Template10 = sRegTemplate10;
            finger.Status = StatusSuccess;
            fpOwners[finger.FpId] = new FingerOwner(student.StudentId, activeFinger);
            axZKFPEngX1.AddRegTemplateStrToFPCacheDBEx(fpcHandle, finger.FpId, finger.Template9, finger.Template10);

            lock (bridgeLock)
            {
                enrollIndex = 3;
                enrollmentStatus = StatusSuccess;
                bridgeMode = "None";
            }

            SetBridgeMessage("Register Succeed: " + student.Name + " " + activeFinger + " finger");
        }

        private void BridgeOnCapture(object sender, AxZKFPEngXControl.IZKFPEngXEvents_OnCaptureEvent e)
        {
            if (bridgeMode == "CaptureOnly")
            {
                capturedTemplate = axZKFPEngX1.GetTemplateAsString();
                captureStatus = String.IsNullOrEmpty(capturedTemplate) ? StatusFailed : StatusSuccess;
                bridgeMode = "None";
                SetBridgeMessage(captureStatus == StatusSuccess ? "Fingerprint captured" : "Fingerprint capture failed");
                return;
            }

            if (bridgeMode == "Verify")
            {
                StudentRecord student = FindStudent(activeStudentId);
                FingerTemplate finger = student == null ? null : GetFinger(student, activeFinger);
                bool regChanged = false;
                string captureTemplate = axZKFPEngX1.GetTemplateAsString();
                string verifyTemplate = finger == null ? "" : finger.Template10;
                verifyMatched = false;

                if (!String.IsNullOrEmpty(verifyTemplate))
                {
                    verifyMatched = axZKFPEngX1.VerFingerFromStr(ref verifyTemplate, captureTemplate, false, ref regChanged);
                }

                verifyStatus = verifyMatched ? StatusSuccess : StatusFailed;
                bridgeMode = "None";
                SetBridgeMessage(verifyMatched ? "Verify Succeed" : "Verify Failed");
                return;
            }

            if (bridgeMode == "Identify")
            {
                int score = 8;
                int processedNum = 1;
                int id = axZKFPEngX1.IdentificationInFPCacheDB(fpcHandle, e.aTemplate, ref score, ref processedNum);

                identifyFpId = id;
                identifyScore = score;
                identifyProcessedNumber = processedNum;
                identifyMatched = id != -1 && fpOwners.ContainsKey(id);
                bridgeMode = "None";
                identifyStatus = identifyMatched ? StatusSuccess : StatusFailed;
                SetBridgeMessage(identifyMatched ? "Identify Succeed" : "Identify Failed");
                return;
            }

            axZKFPEngX1_OnCapture(sender, e);
        }

        public Dictionary<string, object> BridgeGetHealth()
        {
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["ok"] = true;
            data["service"] = BridgeServiceName;
            data["version"] = BridgeVersion;
            data["timestamp"] = DateTime.UtcNow.ToString("o");
            data["message"] = bridgeMessage;
            return data;
        }

        public Dictionary<string, object> BridgeGetDeviceStatus()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeGetDeviceStatusCore));
        }

        public Dictionary<string, object> BridgeConnectDevice()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeConnectDeviceCore));
        }

        public Dictionary<string, object> BridgeDisconnectDevice()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeDisconnectDeviceCore));
        }

        public Dictionary<string, object> BridgeGetStudents()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeGetStudentsCore));
        }

        public Dictionary<string, object> BridgeRegisterStudent(Dictionary<string, object> body)
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(delegate
            {
                return BridgeRegisterStudentCore(body);
            }));
        }

        public Dictionary<string, object> BridgeStartStudentEnrollment(Dictionary<string, object> body)
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(delegate
            {
                return BridgeStartEnrollmentCore(ReadString(body, "studentId", MockStudentId), NormalizeFinger(ReadString(body, "finger", FingerLeft)));
            }));
        }

        public Dictionary<string, object> BridgeGetEnrollmentStatus()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeGetEnrollmentStatusCore));
        }

        public Dictionary<string, object> BridgeStartCapture()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeStartCaptureCore));
        }

        public Dictionary<string, object> BridgeGetCaptureStatus()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeGetCaptureStatusCore));
        }

        public Dictionary<string, object> BridgeStartStudentVerify(Dictionary<string, object> body)
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(delegate
            {
                return BridgeStartVerifyCore(ReadString(body, "studentId", MockStudentId), NormalizeFinger(ReadString(body, "finger", FingerLeft)));
            }));
        }

        public Dictionary<string, object> BridgeGetVerifyStatus()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeGetVerifyStatusCore));
        }

        public Dictionary<string, object> BridgeStartIdentify()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeStartIdentifyCore));
        }

        public Dictionary<string, object> BridgeGetIdentifyStatus()
        {
            return RunOnUiThread(new Func<Dictionary<string, object>>(BridgeGetIdentifyStatusCore));
        }

        public Dictionary<string, object> BridgeGetLogs()
        {
            Dictionary<string, object> data = new Dictionary<string, object>();
            lock (bridgeLock)
            {
                data["logs"] = bridgeLogs.ToArray();
            }
            return data;
        }

        private T RunOnUiThread<T>(Func<T> callback)
        {
            if (InvokeRequired)
            {
                return (T)Invoke(callback);
            }

            return callback();
        }

        private Dictionary<string, object> BridgeGetDeviceStatusCore()
        {
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["connected"] = bridgeConnected;
            data["sensorCount"] = bridgeConnected ? axZKFPEngX1.SensorCount : 0;
            data["sensorIndex"] = bridgeConnected ? (object)axZKFPEngX1.SensorIndex : null;
            data["serialNumber"] = bridgeConnected ? (object)axZKFPEngX1.SensorSN : null;
            data["engineVersion"] = "10";
            data["fakeFunOn"] = true;
            data["message"] = bridgeConnected ? "Sensor Connected" : "Sensor not connected";
            return data;
        }

        private Dictionary<string, object> BridgeConnectDeviceCore()
        {
            if (bridgeConnected)
            {
                Dictionary<string, object> alreadyConnected = BridgeGetDeviceStatusCore();
                alreadyConnected["success"] = true;
                return alreadyConnected;
            }

            axZKFPEngX1.FakeFunOn = 1;
            rdb10.Checked = true;
            axZKFPEngX1.FPEngineVersion = "10";

            int initResult = axZKFPEngX1.InitEngine();
            if (initResult != 0)
            {
                axZKFPEngX1.EndEngine();
                bridgeConnected = false;
                SetBridgeMessage("Failed to initialize fingerprint sensor");
                return BridgeFailure("Failed to initialize fingerprint sensor", initResult);
            }

            fpcHandle = axZKFPEngX1.CreateFPCacheDBEx();
            RebuildFingerprintCache();
            FMatchType = 2;
            bridgeConnected = true;
            txtb1.Text = axZKFPEngX1.SensorCount.ToString();
            txtb2.Text = axZKFPEngX1.SensorIndex.ToString();
            txtb5.Text = axZKFPEngX1.SensorSN;
            EnableButton(false);
            SetBridgeMessage("Sensor Connected");

            Dictionary<string, object> data = BridgeGetDeviceStatusCore();
            data["success"] = true;
            return data;
        }

        private Dictionary<string, object> BridgeDisconnectDeviceCore()
        {
            try
            {
                axZKFPEngX1.EndEngine();
            }
            catch
            {
            }

            bridgeConnected = false;
            bridgeMode = "None";
            enrollmentStatus = StatusIdle;
            captureStatus = StatusIdle;
            verifyStatus = StatusIdle;
            identifyStatus = StatusIdle;
            EnableButton(true);
            SetBridgeMessage("Sensor disconnected");

            Dictionary<string, object> data = new Dictionary<string, object>();
            data["success"] = true;
            data["connected"] = false;
            data["message"] = "Sensor disconnected";
            return data;
        }

        private Dictionary<string, object> BridgeGetStudentsCore()
        {
            Dictionary<string, object> data = new Dictionary<string, object>();
            List<Dictionary<string, object>> items = new List<Dictionary<string, object>>();
            foreach (StudentRecord student in students.Values)
            {
                items.Add(StudentToDictionary(student));
            }
            data["students"] = items.ToArray();
            return data;
        }

        private Dictionary<string, object> BridgeRegisterStudentCore(Dictionary<string, object> body)
        {
            string studentId = ReadString(body, "studentId", "").Trim();
            string name = ReadString(body, "name", "").Trim();
            string className = ReadString(body, "className", "").Trim();

            if (String.IsNullOrEmpty(studentId) || String.IsNullOrEmpty(name) || String.IsNullOrEmpty(className))
            {
                return BridgeFailure("Student ID, name, and class are required", null);
            }

            StudentRecord student;
            if (students.ContainsKey(studentId))
            {
                student = students[studentId];
                student.Name = name;
                student.ClassName = className;
                SetBridgeMessage("Student updated: " + studentId);
            }
            else
            {
                student = new StudentRecord(studentId, name, className);
                students[studentId] = student;
                SetBridgeMessage("Student registered: " + studentId);
            }

            Dictionary<string, object> data = new Dictionary<string, object>();
            data["success"] = true;
            data["student"] = StudentToDictionary(student);
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeStartEnrollmentCore(string studentId, string fingerName)
        {
            Dictionary<string, object> notReady = RequireConnected();
            if (notReady != null)
            {
                return notReady;
            }

            StudentRecord student = FindStudent(studentId);
            if (student == null)
            {
                return BridgeFailure("Student not found", null);
            }

            if (axZKFPEngX1.IsRegister)
            {
                axZKFPEngX1.CancelEnroll();
            }

            activeStudentId = student.StudentId;
            activeFinger = fingerName;
            enrollmentStatus = StatusWaiting;
            enrollIndex = 0;
            bridgeMode = "Enrollment";
            GetFinger(student, activeFinger).Status = StatusWaiting;
            axZKFPEngX1.EnrollCount = 3;
            axZKFPEngX1.BeginEnroll();
            SetBridgeMessage("Place the same " + activeFinger + " finger on the reader 3 times");

            Dictionary<string, object> data = new Dictionary<string, object>();
            data["started"] = true;
            data["studentId"] = student.StudentId;
            data["finger"] = activeFinger;
            data["status"] = StatusWaiting;
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeGetEnrollmentStatusCore()
        {
            StudentRecord student = FindStudent(activeStudentId);
            FingerTemplate finger = student == null ? null : GetFinger(student, activeFinger);
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["studentId"] = activeStudentId;
            data["finger"] = activeFinger;
            data["status"] = enrollmentStatus;
            data["enrollIndex"] = enrollIndex;
            data["lastQuality"] = lastQuality == 0 ? (object)null : lastQuality;
            data["fpId"] = finger == null ? 0 : finger.FpId;
            data["template9Length"] = finger == null ? 0 : finger.Template9.Length;
            data["template10Length"] = finger == null ? 0 : finger.Template10.Length;
            data["template10"] = finger == null || String.IsNullOrEmpty(finger.Template10) ? null : (object)finger.Template10;
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeStartCaptureCore()
        {
            Dictionary<string, object> notReady = RequireConnected();
            if (notReady != null)
            {
                return notReady;
            }

            if (axZKFPEngX1.IsRegister)
            {
                axZKFPEngX1.CancelEnroll();
            }

            capturedTemplate = "";
            captureStatus = StatusWaiting;
            bridgeMode = "CaptureOnly";
            axZKFPEngX1.BeginCapture();
            SetBridgeMessage("Place finger on reader to capture");

            Dictionary<string, object> data = new Dictionary<string, object>();
            data["started"] = true;
            data["status"] = StatusWaiting;
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeGetCaptureStatusCore()
        {
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["status"] = captureStatus;
            data["templateLength"] = capturedTemplate.Length;
            data["template"] = String.IsNullOrEmpty(capturedTemplate) ? null : (object)capturedTemplate;
            data["lastQuality"] = lastQuality == 0 ? (object)null : lastQuality;
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeStartVerifyCore(string studentId, string fingerName)
        {
            Dictionary<string, object> notReady = RequireConnected();
            if (notReady != null)
            {
                return notReady;
            }

            StudentRecord student = FindStudent(studentId);
            FingerTemplate finger = student == null ? null : GetFinger(student, fingerName);
            if (finger == null || String.IsNullOrEmpty(finger.Template10))
            {
                return BridgeFailure("Selected finger has no enrolled template", null);
            }

            if (axZKFPEngX1.IsRegister)
            {
                axZKFPEngX1.CancelEnroll();
            }

            activeStudentId = student.StudentId;
            activeFinger = fingerName;
            verifyMatched = false;
            verifyStatus = StatusWaiting;
            bridgeMode = "Verify";
            FMatchType = 1;
            axZKFPEngX1.BeginCapture();
            SetBridgeMessage("Place " + activeFinger + " finger on reader to verify " + student.Name);

            Dictionary<string, object> data = new Dictionary<string, object>();
            data["started"] = true;
            data["status"] = StatusWaiting;
            data["studentId"] = student.StudentId;
            data["finger"] = activeFinger;
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeGetVerifyStatusCore()
        {
            StudentRecord student = FindStudent(activeStudentId);
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["status"] = verifyStatus;
            data["matched"] = verifyMatched;
            data["studentId"] = verifyMatched && student != null ? (object)student.StudentId : null;
            data["studentName"] = verifyMatched && student != null ? (object)student.Name : null;
            data["className"] = verifyMatched && student != null ? (object)student.ClassName : null;
            data["finger"] = verifyMatched ? (object)activeFinger : null;
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeStartIdentifyCore()
        {
            Dictionary<string, object> notReady = RequireConnected();
            if (notReady != null)
            {
                return notReady;
            }

            if (fpOwners.Count == 0)
            {
                return BridgeFailure("No enrolled fingerprints available", null);
            }

            if (axZKFPEngX1.IsRegister)
            {
                axZKFPEngX1.CancelEnroll();
            }

            identifyMatched = false;
            identifyFpId = -1;
            identifyScore = 0;
            identifyProcessedNumber = 1;
            identifyStatus = StatusWaiting;
            bridgeMode = "Identify";
            FMatchType = 2;
            axZKFPEngX1.BeginCapture();
            SetBridgeMessage("Place finger on reader to identify student");

            Dictionary<string, object> data = new Dictionary<string, object>();
            data["started"] = true;
            data["status"] = StatusWaiting;
            data["message"] = bridgeMessage;
            return data;
        }

        private Dictionary<string, object> BridgeGetIdentifyStatusCore()
        {
            FingerOwner owner = identifyMatched && fpOwners.ContainsKey(identifyFpId) ? fpOwners[identifyFpId] : null;
            StudentRecord student = owner == null ? null : FindStudent(owner.StudentId);
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["status"] = identifyStatus;
            data["matched"] = identifyMatched;
            data["fpId"] = identifyMatched ? identifyFpId : -1;
            data["studentId"] = identifyMatched && student != null ? (object)student.StudentId : null;
            data["studentName"] = identifyMatched && student != null ? (object)student.Name : null;
            data["className"] = identifyMatched && student != null ? (object)student.ClassName : null;
            data["finger"] = identifyMatched && owner != null ? (object)owner.Finger : null;
            data["score"] = identifyScore;
            data["processedNumber"] = identifyProcessedNumber;
            data["message"] = bridgeMessage;
            return data;
        }

        private void EnsureMockStudent()
        {
            if (!students.ContainsKey(MockStudentId))
            {
                students[MockStudentId] = new StudentRecord(MockStudentId, MockStudentName, MockStudentClassName);
            }
        }

        private StudentRecord FindStudent(string studentId)
        {
            if (String.IsNullOrEmpty(studentId) || !students.ContainsKey(studentId))
            {
                return null;
            }
            return students[studentId];
        }

        private FingerTemplate GetFinger(StudentRecord student, string fingerName)
        {
            return NormalizeFinger(fingerName) == FingerRight ? student.RightFinger : student.LeftFinger;
        }

        private string NormalizeFinger(string fingerName)
        {
            if (!String.IsNullOrEmpty(fingerName) && fingerName.ToLowerInvariant() == FingerRight)
            {
                return FingerRight;
            }
            return FingerLeft;
        }

        private Dictionary<string, object> StudentToDictionary(StudentRecord student)
        {
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["studentId"] = student.StudentId;
            data["name"] = student.Name;
            data["className"] = student.ClassName;
            data["leftFinger"] = FingerToDictionary(student.LeftFinger);
            data["rightFinger"] = FingerToDictionary(student.RightFinger);
            data["fullyEnrolled"] = student.LeftFinger.Status == StatusSuccess && student.RightFinger.Status == StatusSuccess;
            return data;
        }

        private Dictionary<string, object> FingerToDictionary(FingerTemplate finger)
        {
            Dictionary<string, object> data = new Dictionary<string, object>();
            data["fpId"] = finger.FpId == 0 ? (object)null : finger.FpId;
            data["status"] = finger.Status;
            data["template9Length"] = finger.Template9.Length;
            data["template10Length"] = finger.Template10.Length;
            return data;
        }

        private void RebuildFingerprintCache()
        {
            fpOwners.Clear();
            foreach (StudentRecord student in students.Values)
            {
                AddFingerToCache(student, FingerLeft, student.LeftFinger);
                AddFingerToCache(student, FingerRight, student.RightFinger);
            }
        }

        private void AddFingerToCache(StudentRecord student, string fingerName, FingerTemplate finger)
        {
            if (finger.FpId > 0 && !String.IsNullOrEmpty(finger.Template9) && !String.IsNullOrEmpty(finger.Template10))
            {
                axZKFPEngX1.AddRegTemplateStrToFPCacheDBEx(fpcHandle, finger.FpId, finger.Template9, finger.Template10);
                fpOwners[finger.FpId] = new FingerOwner(student.StudentId, fingerName);
            }
        }

        private Dictionary<string, object> RequireConnected()
        {
            if (bridgeConnected)
            {
                return null;
            }

            return BridgeFailure("Device is not connected", null);
        }

        private Dictionary<string, object> BridgeFailure(string message, object errorCode)
        {
            SetBridgeMessage(message);

            Dictionary<string, object> data = new Dictionary<string, object>();
            data["success"] = false;
            data["connected"] = bridgeConnected;
            data["message"] = message;
            if (errorCode != null)
            {
                data["errorCode"] = errorCode;
            }
            return data;
        }

        private string ReadString(Dictionary<string, object> body, string key, string fallback)
        {
            if (body == null || !body.ContainsKey(key) || body[key] == null)
            {
                return fallback;
            }
            return body[key].ToString();
        }

        private void SetBridgeMessage(string message)
        {
            lock (bridgeLock)
            {
                bridgeMessage = message;
            }

            if (statusBar1 != null && statusBar1.Panels.Count > 0)
            {
                statusBar1.Panels[0].Text = message;
            }

            AddBridgeLog(message);
        }

        private void AddBridgeLog(string message)
        {
            lock (bridgeLock)
            {
                if (bridgeLogs.Count > 0 && bridgeLogs[bridgeLogs.Count - 1].EndsWith(message))
                {
                    return;
                }

                bridgeLogs.Add(DateTime.Now.ToString("HH:mm:ss") + " " + message);
                while (bridgeLogs.Count > 50)
                {
                    bridgeLogs.RemoveAt(0);
                }
            }
        }

        private class StudentRecord
        {
            public readonly string StudentId;
            public string Name;
            public string ClassName;
            public readonly FingerTemplate LeftFinger = new FingerTemplate();
            public readonly FingerTemplate RightFinger = new FingerTemplate();

            public StudentRecord(string studentId, string name, string className)
            {
                StudentId = studentId;
                Name = name;
                ClassName = className;
            }
        }

        private class FingerTemplate
        {
            public int FpId;
            public string Status = StatusIdle;
            public string Template9 = "";
            public string Template10 = "";
        }

        private class FingerOwner
        {
            public readonly string StudentId;
            public readonly string Finger;

            public FingerOwner(string studentId, string finger)
            {
                StudentId = studentId;
                Finger = finger;
            }
        }
    }
}
