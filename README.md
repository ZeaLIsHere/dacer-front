# DagangCerdas - Asisten Bisnis Virtual

Aplikasi kasir pintar berbasis web untuk pengusaha ultra-mikro dengan fitur AI analytics dan manajemen toko terintegrasi.

## 🚀 Fitur Utama

- **Kasir Digital**: Sistem POS lengkap dengan keranjang belanja dan checkout
- **Manajemen Stok**: Monitoring inventory real-time dengan notifikasi otomatis
- **Analytics AI**: Insight bisnis cerdas dengan prediksi tren dan rekomendasi
- **Multi-Store**: Kelola beberapa toko dalam satu akun
- **Notifikasi Pintar**: Alert untuk stok habis, produk laris, dan insight bisnis
- **Statistik Lengkap**: Dashboard dengan grafik penjualan dan performa produk
- **PWA Support**: Dapat diinstall di device sebagai aplikasi native
- **Responsive Design**: Optimized untuk mobile dan desktop

## 🛠️ Teknologi

- **Frontend**: React 18 + Vite
- **Backend**: Firebase (Firestore, Auth)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js (versi 16 atau lebih baru)
- npm atau yarn
- Akun Firebase untuk database

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd pemweb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root project dan copy dari `.env.example`:

```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Firebase Anda:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Setup Security Rules (lihat `firestore.rules`)
5. Copy konfigurasi ke file `.env`

### 5. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors automatically
```

## 🏗️ Project Structure

```
pemweb/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   └── test/               # Test files
├── public/                 # Static assets
├── api/                    # Serverless API functions
└── docs/                   # Documentation
```

## 🎯 Penggunaan

### 1. Registration & Login
- Buat akun dengan email dan password
- Login untuk mengakses dashboard

### 2. Setup Toko
- Buat toko pertama melalui halaman Settings
- Atur informasi toko (nama, pemilik, dll)

### 3. Manajemen Produk
- Tambah produk melalui halaman Stock
- Set harga, kategori, dan stok awal
- Monitor inventory secara real-time

### 4. Penjualan
- Gunakan halaman Cashier untuk transaksi
- Scan atau pilih produk
- Proses pembayaran dan cetak struk

### 5. Analytics
- Lihat statistik di halaman Statistics
- Monitor notifikasi penting
- Dapatkan insight AI untuk optimasi bisnis

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Firebase Hosting

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login and init
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## 🧪 Testing

Project ini menggunakan Vitest untuk unit testing:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request


## 🆘 Troubleshooting

### Firebase Connection Issues
- Pastikan konfigurasi Firebase di `.env` benar
- Check Firebase project settings
- Verifikasi Firestore rules

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run build --force`
- Check for TypeScript errors

### Development Server Issues
- Check port availability (default: 5173)
- Restart development server
- Check network configuration

## 📞 Support

Untuk bantuan dan pertanyaan:
- Buat issue di repository ini
- Contact: [anaksimpang31@gmail.com]

---

**DagangCerdas** - Memberdayakan UMKM dengan teknologi AI 🚀
