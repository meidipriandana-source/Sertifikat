import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Terminal, FolderTree, Server, Layout, 
  KeyRound, ShieldCheck, Copy, Check, ExternalLink, FileCode, CheckCircle2
} from 'lucide-react';

interface IntegrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationGuideModal: React.FC<IntegrationGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'structure' | 'backend' | 'frontend' | 'security'>('console');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const folderStructureCode = `sistem-manajemen-sertifikat/
├── server.ts                 # Backend Express: Endpoint upload, Google Drive v3 REST & DB
├── package.json              # Dependency deklarasi (multer, express, googleapis, vite, react)
├── data/
│   └── certificates.json     # File database penyimpanan metadata (atau SQLite/MongoDB)
├── src/
│   ├── main.tsx              # Entrypoint React
│   ├── App.tsx               # Komponen utama UI & Navigasi
│   ├── types.ts              # Interface data TypeScript (Certificate, Stats)
│   ├── services/
│   │   ├── api.ts            # Client API Fetcher untuk komunikasi dengan backend
│   │   └── googleAuth.ts     # Inisialisasi token Google Identity Services (GIS)
│   └── components/
│       ├── Header.tsx        # Navbar & status Google Drive
│       ├── DashboardStats.tsx # Ringkasan metrik sertifikat
│       ├── CertificateUploadModal.tsx # Form Upload (Multer) & Drag-and-Drop
│       ├── CertificateList.tsx        # Tabel & Grid Daftar Sertifikat (Google Drive Link)
│       ├── CertificateDetailModal.tsx # Preview Dokumen & Verifikasi Kredensial
│       └── IntegrationGuideModal.tsx  # Panduan Lengkap Developer
└── index.html                # HTML entrypoint`;

  const backendCodeSnippet = `// server.ts (Express + Multer + Google Drive REST API v3)
import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

// 1. Setup Multer (Penyimpanan sementara di Memory Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // Maksimal 30MB
});

// 2. Fungsi Unggah ke Google Drive v3 (Multipart Upload)
async function uploadToGoogleDrive(accessToken: string, fileBuffer: Buffer, fileName: string, mimeType: string, folderId?: string) {
  const boundary = '-------314159265358979323846';
  const delimiter = \`\\r\\n--\${boundary}\\r\\n\`;
  const closeDelimiter = \`\\r\\n--\${boundary}--\`;

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: folderId ? [folderId] : undefined
  };

  const multipartBody = Buffer.concat([
    Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\\r\\n\\r\\n' + JSON.stringify(metadata) + delimiter + \`Content-Type: \${mimeType}\\r\\n\\r\\n\`),
    fileBuffer,
    Buffer.from(closeDelimiter)
  ]);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': \`multipart/related; boundary=\${boundary}\`,
      'Content-Length': multipartBody.length.toString()
    },
    body: multipartBody
  });

  if (!response.ok) {
    throw new Error(\`Drive API Error: \${await response.text()}\`);
  }
  return await response.json(); // { id, name, webViewLink, webContentLink }
}

// 3. Endpoint Upload Sertifikat
app.post('/api/certificates/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { title, recipientName, issueDate, category } = req.body;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!file || !title || !recipientName) {
      return res.status(400).json({ error: 'File dan data sertifikat wajib diisi!' });
    }

    // Unggah file fisik ke Google Drive
    const driveFile = await uploadToGoogleDrive(accessToken!, file.buffer, file.originalname, file.mimetype);

    // Simpan Metadata + Tautan Google Drive ke Database
    const newCertificate = {
      id: 'cert_' + Date.now(),
      title,
      recipientName,
      issueDate,
      category,
      driveFileId: driveFile.id,
      webViewLink: driveFile.webViewLink,
      webContentLink: driveFile.webContentLink,
      fileName: file.originalname,
      createdAt: new Date().toISOString()
    };

    // Simpan ke database (JSON file / SQLite / MongoDB)
    // db.insert(newCertificate)...

    res.status(201).json({ success: true, data: newCertificate });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server berjalan di port 3000'));`;

  const frontendCodeSnippet = `<!-- Frontend Sederhana: Form Upload & Tabel Sertifikat -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Manajemen Sertifikat</title>
</head>
<body>
  <h1>Unggah Sertifikat ke Google Drive</h1>

  <form id="uploadForm">
    <input type="text" id="title" placeholder="Nama Sertifikat (Juara 1 Lomba Web)" required /><br/>
    <input type="text" id="recipientName" placeholder="Nama Pemilik" required /><br/>
    <input type="date" id="issueDate" required /><br/>
    <input type="file" id="certFile" accept=".pdf,.jpg,.png" required /><br/>
    <button type="submit">Unggah ke Google Drive</button>
  </form>

  <h2>Daftar Sertifikat Terdaftar</h2>
  <table border="1" id="certTable">
    <thead>
      <tr>
        <th>Nama Sertifikat</th>
        <th>Pemilik</th>
        <th>Tanggal</th>
        <th>Google Drive Link</th>
      </tr>
    </thead>
    <tbody id="certList"></tbody>
  </table>

  <script>
    const form = document.getElementById('uploadForm');
    
    // Submit Form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('title', document.getElementById('title').value);
      formData.append('recipientName', document.getElementById('recipientName').value);
      formData.append('issueDate', document.getElementById('issueDate').value);
      formData.append('file', document.getElementById('certFile').files[0]);

      const token = localStorage.getItem('gdrive_token'); // Access token Google Drive
      
      const res = await fetch('/api/certificates/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      const data = await res.json();
      if(data.success) {
        alert('Sertifikat berhasil diunggah!');
        loadCertificates();
      }
    });

    // Ambil Data Sertifikat
    async function loadCertificates() {
      const res = await fetch('/api/certificates');
      const json = await res.json();
      const tbody = document.getElementById('certList');
      tbody.innerHTML = json.data.map(c => \`
        <tr>
          <td>\${c.title}</td>
          <td>\${c.recipientName}</td>
          <td>\${c.issueDate}</td>
          <td><a href="\${c.webViewLink}" target="_blank">Lihat di Google Drive</a></td>
        </tr>
      \`).join('');
    }
    loadCertificates();
  </script>
</body>
</html>`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-colors"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            id="modal-integration-guide"
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]"
          >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Panduan Developer: Sistem Manajemen Sertifikat + Google Drive
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tutorial arsitektur backend, Google Cloud Console, Multer, dan Database
              </p>
            </div>
          </div>
          <button
            id="btn-close-guide-modal"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'console', label: '1. Google Cloud Console', icon: KeyRound },
            { id: 'structure', label: '2. Struktur Folder', icon: FolderTree },
            { id: 'backend', label: '3. Kode Backend (Node/Express)', icon: Server },
            { id: 'frontend', label: '4. Kode Frontend', icon: Layout },
            { id: 'security', label: '5. Keamanan & Best Practice', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/40'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* TAB 1: GOOGLE CLOUD CONSOLE */}
          {activeTab === 'console' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60">
                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-300 mb-1">
                  Langkah Persiapan Google Cloud Platform (GCP)
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  Untuk mengaktifkan pengunggahan otomatis ke Google Drive, ikuti langkah mudah di bawah ini:
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Buat / Pilih Proyek di Google Cloud Console</h4>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Kunjungi <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-medium">console.cloud.google.com</a>, login dengan akun Google Anda, lalu buat proyek baru bernama <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono">Sistem Manajemen Sertifikat</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Aktifkan Google Drive API</h4>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Buka menu <strong>APIs & Services &gt; Library</strong>, cari <strong>Google Drive API</strong>, lalu klik tombol <strong>Enable</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Konfigurasi OAuth Consent Screen & Scopes</h4>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Buka <strong>APIs & Services &gt; OAuth consent screen</strong>. Pilih tipe User (External), masukkan nama aplikasi dan email support. Pada bagian <strong>Scopes</strong>, tambahkan scope:
                    </p>
                    <code className="block mt-2 p-2 bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono rounded-lg border border-slate-800">
                      https://www.googleapis.com/auth/drive.file
                    </code>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Opsi Kredensial: OAuth 2.0 Client ID atau Service Account</h4>
                    <ul className="mt-1.5 space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-400">
                      <li>
                        <strong>OAuth 2.0 Web Client ID (Direkomendasikan)</strong>: Pengguna login dengan akun Google mereka, dan file sertifikat disimpan di Google Drive pribadi milik pengguna.
                      </li>
                      <li>
                        <strong>Service Account</strong>: Cocok jika seluruh sertifikat institusi ingin disimpan di satu Google Drive terpusat (Shared Drive). Unduh file <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded font-mono">credentials.json</code> dan simpan dengan aman di server.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FOLDER STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Struktur direktori standar proyek Full-Stack TypeScript / Node.js:
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(folderStructureCode, 'structure')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                >
                  {copiedSection === 'structure' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'structure' ? 'Tersalin!' : 'Salin Struktur'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {folderStructureCode}
              </pre>
            </div>
          )}

          {/* TAB 3: BACKEND CODE */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Implementasi Backend Express + Multer + Google Drive REST API</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Memproses upload sementara di memory dan mengirim multipart stream ke Google Drive v3.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(backendCodeSnippet, 'backend')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 shrink-0 cursor-pointer"
                >
                  {copiedSection === 'backend' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'backend' ? 'Tersalin!' : 'Salin Kode Backend'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                {backendCodeSnippet}
              </pre>
            </div>
          )}

          {/* TAB 4: FRONTEND CODE */}
          {activeTab === 'frontend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Implementasi Frontend (HTML / JavaScript / React)</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Mengirim FormData multipart ke endpoint backend dan menampilkan daftar tautan Drive.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(frontendCodeSnippet, 'frontend')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 shrink-0 cursor-pointer"
                >
                  {copiedSection === 'frontend' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'frontend' ? 'Tersalin!' : 'Salin Kode Frontend'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                {frontendCodeSnippet}
              </pre>
            </div>
          )}

          {/* TAB 5: SECURITY & BEST PRACTICES */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Praktik Terbaik & Keamanan Produksi</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Validasi Tipe File (MIME-Type)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Gunakan filter pada Multer di backend untuk memastikan hanya file dokumen yang sah (<code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">application/pdf</code>, <code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">image/png</code>, <code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">image/jpeg</code>) yang dapat diunggah.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Penyimpanan Ramah Server (MemoryBuffer)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Gunakan <code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">multer.memoryStorage()</code> agar file tidak membebani hard drive lokal server dan langsung diteruskan (streaming) ke Google Drive API.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Folder Khusus Terpusat</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Buat folder otomatis seperti <code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">📁 Sertifikat Digital</code> di Google Drive pengguna dengan atribut <code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">parents: [folderId]</code> agar Drive pengguna tetap rapi.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Pengelolaan Kredensial Rahasia (.env)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Jangan pernah memasukkan <code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">client_secret</code> atau API Key di repositori publik. Selalu gunakan environment variable (<code className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 rounded">.env</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sistem Manajemen Sertifikat Digital • Diklat RSUD dr. H. Jusuf SK
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 dark:shadow-indigo-950/50 transition-all cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
