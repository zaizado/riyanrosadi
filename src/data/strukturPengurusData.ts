export interface PengurusItem {
  id: string;
  nik: string;
  nama: string;
  jabatan: string;
  bidang: string;
  departemen: string;
  bagian: string;
  noHp?: string;
  fotoUrl?: string;
}

export const STRUKTUR_PENGURUS_DATA: PengurusItem[] = [
  // Pimpinan & Kesekretariatan
  {
    id: 'pengurus-1',
    nik: '010670',
    nama: 'Awaludin',
    jabatan: 'Ketua',
    bidang: 'Pimpinan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-2',
    nik: '016373',
    nama: 'Darja',
    jabatan: 'Wakil Ketua',
    bidang: 'Pimpinan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-3',
    nik: '021224',
    nama: 'Heri Fadli',
    jabatan: 'Sekretaris',
    bidang: 'Kesekretariatan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-4',
    nik: '012272',
    nama: 'Pipin',
    jabatan: 'Divisi Kesekretariatan',
    bidang: 'Kesekretariatan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Penelitian dan Pengembangan
  {
    id: 'pengurus-5',
    nik: '014643',
    nama: 'Budi Prayitno',
    jabatan: 'Divisi Penelitian dan Pengembangan',
    bidang: 'Divisi Penelitian dan Pengembangan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-6',
    nik: '031738',
    nama: 'Riyan Rosadi',
    jabatan: 'Divisi Penelitian dan Pengembangan',
    bidang: 'Divisi Penelitian dan Pengembangan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-7',
    nik: '031386',
    nama: 'Yogi Alfian',
    jabatan: 'Divisi Penelitian dan Pengembangan',
    bidang: 'Divisi Penelitian dan Pengembangan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-8',
    nik: '031390',
    nama: 'Pandu Purna Saputra',
    jabatan: 'Divisi Penelitian dan Pengembangan',
    bidang: 'Divisi Penelitian dan Pengembangan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-9',
    nik: '030571',
    nama: 'Risa Bahari',
    jabatan: 'Divisi Penelitian dan Pengembangan',
    bidang: 'Divisi Penelitian dan Pengembangan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-10',
    nik: '014870',
    nama: 'Wahyu Hidayat',
    jabatan: 'Divisi Penelitian dan Pengembangan',
    bidang: 'Divisi Penelitian dan Pengembangan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Hukum dan Advokasi
  {
    id: 'pengurus-11',
    nik: '032149',
    nama: 'Regha Mandala Putra S',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-12',
    nik: '031580',
    nama: 'Luthfi Hidayat',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-13',
    nik: '036005',
    nama: 'Agung Priastowo',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-14',
    nik: '022204',
    nama: 'Hambali',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-15',
    nik: '030886',
    nama: 'Agus Supriyatin',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-16',
    nik: '006654',
    nama: 'Siti Janawati',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-17',
    nik: '034301',
    nama: 'Cecep Supriadi',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-18',
    nik: '030616',
    nama: 'Agung Gunawan',
    jabatan: 'Divisi Hukum dan Advokasi',
    bidang: 'Divisi Hukum dan Advokasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Perjuangan Buruh Perempuan
  {
    id: 'pengurus-19',
    nik: '022446',
    nama: 'Siti Masitoh',
    jabatan: 'Divisi Perjuangan Buruh Perempuan',
    bidang: 'Divisi Perjuangan Buruh Perempuan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-20',
    nik: '014396',
    nama: 'Tajudin',
    jabatan: 'Divisi Perjuangan Buruh Perempuan',
    bidang: 'Divisi Perjuangan Buruh Perempuan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-21',
    nik: '033824',
    nama: 'Sinta Oktaviyani',
    jabatan: 'Divisi Perjuangan Buruh Perempuan',
    bidang: 'Divisi Perjuangan Buruh Perempuan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-22',
    nik: '033202',
    nama: 'Suema Indriyani',
    jabatan: 'Divisi Perjuangan Buruh Perempuan',
    bidang: 'Divisi Perjuangan Buruh Perempuan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-23',
    nik: '011298',
    nama: 'Novi Sri Mawarti',
    jabatan: 'Divisi Perjuangan Buruh Perempuan',
    bidang: 'Divisi Perjuangan Buruh Perempuan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Pengembangan Organisasi
  {
    id: 'pengurus-24',
    nik: '035691',
    nama: 'Ramdan Qurniawan',
    jabatan: 'Divisi Pengembangan Organisasi',
    bidang: 'Divisi Pengembangan Organisasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-25',
    nik: '030584',
    nama: 'Dede Kurniawan',
    jabatan: 'Divisi Pengembangan Organisasi',
    bidang: 'Divisi Pengembangan Organisasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-26',
    nik: '017992',
    nama: 'Sulhi',
    jabatan: 'Divisi Pengembangan Organisasi',
    bidang: 'Divisi Pengembangan Organisasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-27',
    nik: '030323',
    nama: 'Muhamad Sonaji',
    jabatan: 'Divisi Pengembangan Organisasi',
    bidang: 'Divisi Pengembangan Organisasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-28',
    nik: '022402',
    nama: 'Arif Sujarwanto',
    jabatan: 'Divisi Pengembangan Organisasi',
    bidang: 'Divisi Pengembangan Organisasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-29',
    nik: '034053',
    nama: 'Muhamad Kadafi',
    jabatan: 'Divisi Pengembangan Organisasi',
    bidang: 'Divisi Pengembangan Organisasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-30',
    nik: '020999',
    nama: 'Idah',
    jabatan: 'Divisi Pengembangan Organisasi',
    bidang: 'Divisi Pengembangan Organisasi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Dana dan Usaha
  {
    id: 'pengurus-31',
    nik: '019915',
    nama: 'Anggie Ero Ratalia Putri',
    jabatan: 'Divisi Dana dan Usaha',
    bidang: 'Divisi Dana dan Usaha',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-32',
    nik: '035494',
    nama: 'Inke Permata Sari',
    jabatan: 'Divisi Dana dan Usaha',
    bidang: 'Divisi Dana dan Usaha',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-33',
    nik: '033185',
    nama: 'Siti Nurhasanah',
    jabatan: 'Divisi Dana dan Usaha',
    bidang: 'Divisi Dana dan Usaha',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Pendidikan
  {
    id: 'pengurus-34',
    nik: '016090',
    nama: 'Muhammad Firli',
    jabatan: 'Divisi Pendidikan',
    bidang: 'Divisi Pendidikan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-35',
    nik: '018925',
    nama: 'Jonsen Romando',
    jabatan: 'Divisi Pendidikan',
    bidang: 'Divisi Pendidikan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-36',
    nik: '031941',
    nama: 'Ahmad Royani',
    jabatan: 'Divisi Pendidikan',
    bidang: 'Divisi Pendidikan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-37',
    nik: '034396',
    nama: 'Ade Imasruroh',
    jabatan: 'Divisi Pendidikan',
    bidang: 'Divisi Pendidikan',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Komando Bara Kasbi
  {
    id: 'pengurus-38',
    nik: '035346',
    nama: 'Ananda Surya Perdana',
    jabatan: 'Komando Bara Kasbi',
    bidang: 'Komando Bara Kasbi',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Seni Budaya dan Olahraga
  {
    id: 'pengurus-39',
    nik: '030702',
    nama: 'Sandi Setiawan',
    jabatan: 'Divisi Seni Budaya dan Olahraga',
    bidang: 'Divisi Seni Budaya dan Olahraga',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-40',
    nik: '032090',
    nama: 'Juari',
    jabatan: 'Divisi Seni Budaya dan Olahraga',
    bidang: 'Divisi Seni Budaya dan Olahraga',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-41',
    nik: '016773',
    nama: 'Ani Rohani',
    jabatan: 'Divisi Seni Budaya dan Olahraga',
    bidang: 'Divisi Seni Budaya dan Olahraga',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },

  // Divisi Media dan Propaganda
  {
    id: 'pengurus-42',
    nik: '034024',
    nama: 'Muhamad Abdul Hamid',
    jabatan: 'Divisi Media dan Propaganda',
    bidang: 'Divisi Media dan Propaganda',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-43',
    nik: '021173',
    nama: 'Muhamad Rahmat Apriadi',
    jabatan: 'Divisi Media dan Propaganda',
    bidang: 'Divisi Media dan Propaganda',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-44',
    nik: '033434',
    nama: 'Pahruh Rozi',
    jabatan: 'Divisi Media dan Propaganda',
    bidang: 'Divisi Media dan Propaganda',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  },
  {
    id: 'pengurus-45',
    nik: '032219',
    nama: 'Devi Wulandari',
    jabatan: 'Divisi Media dan Propaganda',
    bidang: 'Divisi Media dan Propaganda',
    departemen: 'PT Victory Chingluh Indonesia',
    bagian: 'SBN KASBI VCI'
  }
];
