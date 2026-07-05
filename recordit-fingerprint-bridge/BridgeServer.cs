using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

namespace Biokey01
{
    public class BridgeServer : IDisposable
    {
        private readonly Form1 form;
        private readonly int port;
        private readonly JavaScriptSerializer serializer;
        private TcpListener listener;
        private Thread listenerThread;
        private bool running;

        public BridgeServer(Form1 form, int port)
        {
            this.form = form;
            this.port = port;
            serializer = new JavaScriptSerializer();
        }

        public void Start()
        {
            if (running)
            {
                return;
            }

            listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();
            running = true;
            listenerThread = new Thread(ListenLoop);
            listenerThread.IsBackground = true;
            listenerThread.Start();
        }

        public void Dispose()
        {
            running = false;
            if (listener != null)
            {
                listener.Stop();
            }
        }

        private void ListenLoop()
        {
            while (running)
            {
                try
                {
                    TcpClient client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(HandleClient, client);
                }
                catch
                {
                    if (running)
                    {
                        Thread.Sleep(250);
                    }
                }
            }
        }

        private void HandleClient(object state)
        {
            TcpClient client = (TcpClient)state;
            using (client)
            {
                try
                {
                    NetworkStream stream = client.GetStream();
                    HttpRequest request = ReadRequest(stream);
                    if (request == null)
                    {
                        return;
                    }

                    if (request.Method == "OPTIONS")
                    {
                        WriteJson(stream, 204, new Dictionary<string, object>());
                        return;
                    }

                    Dictionary<string, object> response = Dispatch(request);
                    WriteJson(stream, 200, response);
                }
                catch (Exception ex)
                {
                    try
                    {
                        WriteJson(client.GetStream(), 500, Error("bridge_error", ex.Message));
                    }
                    catch
                    {
                    }
                }
            }
        }

        private Dictionary<string, object> Dispatch(HttpRequest request)
        {
            Dictionary<string, object> body = ParseBody(request.Body);

            if (request.Method == "GET" && request.Path == "/health")
            {
                return form.BridgeGetHealth();
            }
            if (request.Method == "GET" && request.Path == "/device/status")
            {
                return form.BridgeGetDeviceStatus();
            }
            if (request.Method == "POST" && request.Path == "/device/connect")
            {
                return form.BridgeConnectDevice();
            }
            if (request.Method == "POST" && request.Path == "/device/disconnect")
            {
                return form.BridgeDisconnectDevice();
            }
            if (request.Method == "GET" && request.Path == "/students")
            {
                return form.BridgeGetStudents();
            }
            if (request.Method == "POST" && request.Path == "/students/register")
            {
                return form.BridgeRegisterStudent(body);
            }
            if (request.Method == "POST" && request.Path == "/students/fingerprint/sync")
            {
                return form.BridgeSyncStudents(body);
            }
            if (request.Method == "POST" && request.Path == "/students/fingerprint/enroll/start")
            {
                return form.BridgeStartStudentEnrollment(body);
            }
            if (request.Method == "GET" && request.Path == "/students/fingerprint/enroll/status")
            {
                return form.BridgeGetEnrollmentStatus();
            }
            if (request.Method == "POST" && request.Path == "/students/fingerprint/verify/start")
            {
                return form.BridgeStartStudentVerify(body);
            }
            if (request.Method == "GET" && request.Path == "/students/fingerprint/verify/status")
            {
                return form.BridgeGetVerifyStatus();
            }
            if (request.Method == "POST" && request.Path == "/students/fingerprint/identify/start")
            {
                return form.BridgeStartIdentify();
            }
            if (request.Method == "GET" && request.Path == "/students/fingerprint/identify/status")
            {
                return form.BridgeGetIdentifyStatus();
            }
            if (request.Method == "POST" && request.Path == "/fingerprint/enroll/start")
            {
                return form.BridgeStartStudentEnrollment(body);
            }
            if (request.Method == "GET" && request.Path == "/fingerprint/enroll/status")
            {
                return form.BridgeGetEnrollmentStatus();
            }
            if (request.Method == "POST" && request.Path == "/fingerprint/capture/start")
            {
                return form.BridgeStartCapture();
            }
            if (request.Method == "GET" && request.Path == "/fingerprint/capture/status")
            {
                return form.BridgeGetCaptureStatus();
            }
            if (request.Method == "POST" && request.Path == "/fingerprint/verify/start")
            {
                return form.BridgeStartStudentVerify(body);
            }
            if (request.Method == "GET" && request.Path == "/fingerprint/verify/status")
            {
                return form.BridgeGetVerifyStatus();
            }
            if (request.Method == "POST" && request.Path == "/fingerprint/identify/start")
            {
                return form.BridgeStartIdentify();
            }
            if (request.Method == "GET" && request.Path == "/fingerprint/identify/status")
            {
                return form.BridgeGetIdentifyStatus();
            }
            if (request.Method == "GET" && request.Path == "/logs")
            {
                return form.BridgeGetLogs();
            }

            // Compatibility aliases from the first POC pass.
            if (request.Method == "POST" && request.Path == "/device/init")
            {
                return form.BridgeConnectDevice();
            }
            if (request.Method == "POST" && request.Path == "/device/close")
            {
                return form.BridgeDisconnectDevice();
            }
            if (request.Method == "POST" && request.Path == "/enroll/start")
            {
                return form.BridgeStartStudentEnrollment(body);
            }
            if (request.Method == "GET" && request.Path == "/enroll/status")
            {
                return form.BridgeGetEnrollmentStatus();
            }
            if (request.Method == "POST" && request.Path == "/verify/start")
            {
                return form.BridgeStartStudentVerify(body);
            }
            if (request.Method == "GET" && request.Path == "/verify/status")
            {
                return form.BridgeGetVerifyStatus();
            }
            if (request.Method == "POST" && request.Path == "/identify/start")
            {
                return form.BridgeStartIdentify();
            }
            if (request.Method == "GET" && request.Path == "/identify/status")
            {
                return form.BridgeGetIdentifyStatus();
            }

            return Error("not_found", "Unknown endpoint.");
        }

        private Dictionary<string, object> ParseBody(string body)
        {
            if (String.IsNullOrEmpty(body))
            {
                return new Dictionary<string, object>();
            }

            try
            {
                Dictionary<string, object> parsed = serializer.Deserialize<Dictionary<string, object>>(body);
                return parsed == null ? new Dictionary<string, object>() : parsed;
            }
            catch
            {
                return new Dictionary<string, object>();
            }
        }

        private HttpRequest ReadRequest(NetworkStream stream)
        {
            StreamReader reader = new StreamReader(stream, Encoding.UTF8);
            string requestLine = reader.ReadLine();
            if (String.IsNullOrEmpty(requestLine))
            {
                return null;
            }

            string[] parts = requestLine.Split(' ');
            if (parts.Length < 2)
            {
                return null;
            }

            Dictionary<string, string> headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            string line;
            while (!String.IsNullOrEmpty(line = reader.ReadLine()))
            {
                int separator = line.IndexOf(':');
                if (separator > 0)
                {
                    headers[line.Substring(0, separator).Trim()] = line.Substring(separator + 1).Trim();
                }
            }

            int contentLength = 0;
            if (headers.ContainsKey("Content-Length"))
            {
                Int32.TryParse(headers["Content-Length"], out contentLength);
            }

            char[] bodyChars = new char[contentLength];
            if (contentLength > 0)
            {
                reader.Read(bodyChars, 0, contentLength);
            }

            return new HttpRequest(parts[0], parts[1].Split('?')[0], new string(bodyChars));
        }

        private void WriteJson(NetworkStream stream, int statusCode, Dictionary<string, object> payload)
        {
            if (!payload.ContainsKey("ok") && !payload.ContainsKey("success") && statusCode < 400)
            {
                payload["ok"] = true;
            }

            string json = serializer.Serialize(payload);
            byte[] body = Encoding.UTF8.GetBytes(json);
            string statusText = statusCode == 204 ? "No Content" : statusCode == 200 ? "OK" : "Error";
            string headers =
                "HTTP/1.1 " + statusCode.ToString() + " " + statusText + "\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "Content-Length: " + (statusCode == 204 ? 0 : body.Length).ToString() + "\r\n" +
                "Access-Control-Allow-Origin: http://localhost:3000\r\n" +
                "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                "Access-Control-Allow-Headers: Content-Type\r\n" +
                "Connection: close\r\n\r\n";

            byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (statusCode != 204)
            {
                stream.Write(body, 0, body.Length);
            }
        }

        private Dictionary<string, object> Error(string code, string message)
        {
            Dictionary<string, object> error = new Dictionary<string, object>();
            error["ok"] = false;
            error["code"] = code;
            error["message"] = message;
            return error;
        }

        private class HttpRequest
        {
            public readonly string Method;
            public readonly string Path;
            public readonly string Body;

            public HttpRequest(string method, string path, string body)
            {
                Method = method;
                Path = path;
                Body = body;
            }
        }
    }
}
