-- Support fast global duplicate checks without exposing biometric ownership.
CREATE INDEX "FingerprintTemplate_templateHash_idx" ON "FingerprintTemplate"("templateHash");
