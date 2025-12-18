import { Groq } from 'groq-sdk'

// Check if API key is available
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY

if (!groqApiKey) {
  console.warn('VITE_GROQ_API_KEY is not set. AI features will be limited.')
}

const groq = new Groq({
  apiKey: groqApiKey || 'dummy-key',
  dangerouslyAllowBrowser: true // Hati-hati dengan penggunaan di frontend
})

export const getGroqResponse = async (messages) => {
  // Return fallback response if no API key
  if (!groqApiKey) {
    return 'Maaf, fitur AI sedang dalam pengaturan. Silakan hubungi admin untuk mengaktifkan fitur AI Assistant.'
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Anda adalah asisten AI untuk toko dengan nama DagangCerdas AI. 

PENTING: 
- JANGAN PERNAH mengarang atau membuat data fiktif
- JANGAN memberikan angka penjualan, stok, atau data bisnis spesifik jika tidak ada dalam konteks
- Jika ditanya tentang data penjualan/stok, jelaskan bahwa Anda tidak memiliki akses data real-time dan sarankan untuk cek dashboard
- Berikan jawaban umum tentang strategi bisnis, tips, atau panduan saja
- Jika tidak yakin, katakan "Saya tidak memiliki data tersebut, silakan cek dashboard untuk informasi akurat"
- JANGAN gunakan format markdown bold (**text**) dalam response Anda
- Gunakan plain text saja tanpa formatting khusus

Jawab dengan ringkas, profesional, dan jelas dalam plain text.`
        },
        ...messages
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Lower temperature for more consistent responses
      max_tokens: 800
    })

    return chatCompletion.choices[0]?.message?.content || 'Maaf, saya tidak bisa memberikan jawaban saat ini.'
  } catch (error) {
    console.error('Error calling Groq API:', error)
    
    // Return user-friendly error message
    if (error.message?.includes('API key')) {
      return 'Maaf, konfigurasi AI belum lengkap. Silakan hubungi admin.'
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'Maaf, terjadi masalah koneksi. Silakan coba lagi.'
    } else {
      return 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.'
    }
  }
}
