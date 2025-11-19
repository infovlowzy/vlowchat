import { Chat, Message, Transaction, Business, QuickReply, DashboardStats } from '@/types';

export const mockBusiness: Business = {
  id: '1',
  name: 'Toko Makmur',
  email: 'admin@tokomakmur.id',
  phone: '+62 812-3456-7890',
  timezone: 'Asia/Jakarta',
  language: 'en'
};

export const mockChats: Chat[] = [
  {
    id: '1',
    customerName: 'Budi Santoso',
    channel: 'whatsapp',
    status: 'needs_action',
    mode: 'ai',
    lastMessage: 'Saya sudah transfer, tapi belum ada konfirmasi',
    lastMessageTime: new Date(Date.now() - 5 * 60000),
    unreadCount: 2,
    escalated: true,
    paymentRelated: true,
    tags: ['Payment', 'Urgent'],
    firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60000),
    totalChats: 5
  },
  {
    id: '2',
    customerName: 'Siti Nurhaliza',
    channel: 'web',
    status: 'open',
    mode: 'ai',
    lastMessage: 'Produk sudah sampai, terima kasih!',
    lastMessageTime: new Date(Date.now() - 15 * 60000),
    unreadCount: 0,
    escalated: false,
    paymentRelated: false,
    tags: ['Order Status'],
    firstSeen: new Date(Date.now() - 3 * 24 * 60 * 60000),
    totalChats: 2
  },
  {
    id: '3',
    customerName: 'Ahmad Wijaya',
    channel: 'whatsapp',
    status: 'needs_action',
    mode: 'admin',
    lastMessage: 'Komplain: barang rusak saat diterima',
    lastMessageTime: new Date(Date.now() - 30 * 60000),
    unreadCount: 1,
    escalated: true,
    paymentRelated: false,
    tags: ['Complaint', 'Product Issue'],
    notes: 'Need to check with warehouse',
    firstSeen: new Date(Date.now() - 14 * 24 * 60 * 60000),
    totalChats: 8
  },
  {
    id: '4',
    customerName: 'Dewi Lestari',
    channel: 'web',
    status: 'resolved',
    mode: 'ai',
    lastMessage: 'Oke siap, terima kasih!',
    lastMessageTime: new Date(Date.now() - 60 * 60000),
    unreadCount: 0,
    escalated: false,
    paymentRelated: false,
    tags: ['General Inquiry'],
    firstSeen: new Date(Date.now() - 1 * 24 * 60 * 60000),
    totalChats: 1
  },
  {
    id: '5',
    customerName: 'Rudi Hermawan',
    channel: 'whatsapp',
    status: 'open',
    mode: 'ai',
    lastMessage: 'Berapa harga untuk pengiriman ke Surabaya?',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60000),
    unreadCount: 0,
    escalated: false,
    paymentRelated: false,
    tags: ['Shipping'],
    firstSeen: new Date(Date.now() - 2 * 60 * 60000),
    totalChats: 1
  }
];

export const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      chatId: '1',
      sender: 'customer',
      content: 'Halo, saya mau tanya status pesanan saya',
      timestamp: new Date(Date.now() - 20 * 60000),
      read: true
    },
    {
      id: 'm2',
      chatId: '1',
      sender: 'ai',
      content: 'Halo Budi! Terima kasih telah menghubungi Toko Makmur. Saya bisa bantu cek status pesanan Anda. Bisa berikan nomor pesanan atau nomor WhatsApp yang terdaftar?',
      timestamp: new Date(Date.now() - 19 * 60000),
      read: true
    },
    {
      id: 'm3',
      chatId: '1',
      sender: 'customer',
      content: 'Nomor pesanan #TM-12345',
      timestamp: new Date(Date.now() - 18 * 60000),
      read: true
    },
    {
      id: 'm4',
      chatId: '1',
      sender: 'ai',
      content: 'Terima kasih! Pesanan #TM-12345 sudah dalam proses pengiriman. Estimasi sampai 2-3 hari kerja. Untuk pembayaran, saya lihat statusnya masih pending. Apakah sudah melakukan transfer?',
      timestamp: new Date(Date.now() - 17 * 60000),
      read: true
    },
    {
      id: 'm5',
      chatId: '1',
      sender: 'customer',
      content: 'Saya sudah transfer, tapi belum ada konfirmasi',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false
    }
  ],
  '2': [
    {
      id: 'm6',
      chatId: '2',
      sender: 'customer',
      content: 'Produk sudah sampai, terima kasih!',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: true
    },
    {
      id: 'm7',
      chatId: '2',
      sender: 'ai',
      content: 'Alhamdulillah! Senang mendengarnya. Terima kasih sudah berbelanja di Toko Makmur. Jika ada kendala, jangan ragu untuk menghubungi kami lagi ya 😊',
      timestamp: new Date(Date.now() - 14 * 60000),
      read: true
    }
  ],
  '3': [
    {
      id: 'm8',
      chatId: '3',
      sender: 'customer',
      content: 'Barang yang saya terima rusak',
      timestamp: new Date(Date.now() - 35 * 60000),
      read: true
    },
    {
      id: 'm9',
      chatId: '3',
      sender: 'ai',
      content: 'Mohon maaf atas ketidaknyamanannya. Saya akan bantu eskalasi ke tim untuk penanganan segera. Bisa kirimkan foto barang yang rusak?',
      timestamp: new Date(Date.now() - 34 * 60000),
      read: true
    },
    {
      id: 'm10',
      chatId: '3',
      sender: 'customer',
      content: 'Komplain: barang rusak saat diterima',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: false
    },
    {
      id: 'm11',
      chatId: '3',
      sender: 'admin',
      content: 'Halo Pak Ahmad, saya dari tim Toko Makmur. Kami akan segera proses penggantian barang Anda. Mohon kirimkan foto kondisi barang untuk verifikasi.',
      timestamp: new Date(Date.now() - 25 * 60000),
      read: true
    }
  ]
};

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    customerId: '1',
    customerName: 'Budi Santoso',
    channel: 'whatsapp',
    keyword: 'transfer',
    snippet: 'Saya sudah transfer, tapi belum ada konfirmasi',
    timestamp: new Date(Date.now() - 5 * 60000),
    status: 'awaiting_check',
    chatId: '1'
  },
  {
    id: 't2',
    customerId: '6',
    customerName: 'Linda Wijaya',
    channel: 'web',
    keyword: 'bukti transfer',
    snippet: 'Ini bukti transfernya',
    timestamp: new Date(Date.now() - 60 * 60000),
    status: 'proof_received',
    chatId: '6'
  },
  {
    id: 't3',
    customerId: '7',
    customerName: 'Hendra Kusuma',
    channel: 'whatsapp',
    keyword: 'sudah bayar',
    snippet: 'Sudah bayar tadi pagi jam 9',
    timestamp: new Date(Date.now() - 3 * 60 * 60000),
    status: 'handled',
    handledBy: 'Admin',
    handledAt: new Date(Date.now() - 2 * 60 * 60000),
    chatId: '7'
  }
];

export const mockQuickReplies: QuickReply[] = [
  {
    id: 'q1',
    name: 'Greeting',
    content: 'Halo! Terima kasih telah menghubungi Toko Makmur. Ada yang bisa kami bantu?'
  },
  {
    id: 'q2',
    name: 'Payment Confirmation',
    content: 'Terima kasih atas konfirmasinya. Kami akan segera cek pembayaran Anda dan update statusnya dalam 1-2 jam.',
    channel: 'whatsapp'
  },
  {
    id: 'q3',
    name: 'Shipping Info',
    content: 'Pesanan Anda sudah dalam proses pengiriman. Estimasi sampai 2-3 hari kerja. Nomor resi akan kami kirimkan segera.'
  }
];

export const mockDashboardStats: DashboardStats = {
  todayChats: 24,
  needsActionChats: 3,
  paymentAlerts: 2,
  chatsThisWeek: [
    { date: 'Mon', count: 15 },
    { date: 'Tue', count: 22 },
    { date: 'Wed', count: 18 },
    { date: 'Thu', count: 28 },
    { date: 'Fri', count: 24 },
    { date: 'Sat', count: 19 },
    { date: 'Sun', count: 12 }
  ],
  topIssue: {
    label: 'Late delivery',
    description: 'Customer inquiries about delayed shipments'
  }
};
