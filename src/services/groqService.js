import { Groq } from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Hati-hati dengan penggunaan di frontend
})

export const getGroqResponse = async (messages) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Anda adalah asisten AI untuk toko dengan nama ${messages[0]?.content?.includes('AI') ? 'AI' : 'Asisten'}. 
          
PENTING: 
- JANGAN PERNAH mengarang atau membuat data fiktif
- JANGAN memberikan angka penjualan, stok, atau data bisnis spesifik jika tidak ada dalam konteks
- Jika ditanya tentang data penjualan/stok, jelaskan bahwa Anda tidak memiliki akses data real-time dan sarankan untuk cek dashboard
- Berikan jawaban umum tentang strategi bisnis, tips, atau panduan saja
- Jika tidak yakin, katakan "Saya tidak memiliki data tersebut, silakan cek dashboard untuk informasi akurat"

Jawab dengan ringkas, profesional, dan jelas.`
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
    return 'Maaf, terjadi kesalahan saat memproses permintaan Anda.'
  }
}
