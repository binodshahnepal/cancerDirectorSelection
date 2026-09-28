export interface ProvinceData {
  name: string;
  districts: string[];
}

export const nepalProvinces: ProvinceData[] = [
  {
    name: 'Koshi Province',
    districts: [
      'Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 
      'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 
      'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'
    ]
  },
  {
    name: 'Madhesh Province',
    districts: [
      'Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 
      'Saptari', 'Sarlahi', 'Siraha'
    ]
  },
  {
    name: 'Bagmati Province',
    districts: [
      'Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 
      'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 
      'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'
    ]
  },
  {
    name: 'Gandaki Province',
    districts: [
      'Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 
      'Mustang', 'Myagdi', 'Nawalpur (Nawalparasi East)', 'Parbat', 
      'Syangja', 'Tanahun'
    ]
  },
  {
    name: 'Lumbini Province',
    districts: [
      'Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 
      'Kapilvastu', 'Palpa', 'Parasi (Nawalparasi West)', 'Pyuthan', 
      'Rolpa', 'Rukum East', 'Rupandehi'
    ]
  },
  {
    name: 'Karnali Province',
    districts: [
      'Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 
      'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'
    ]
  },
  {
    name: 'Sudurpashchim Province',
    districts: [
      'Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 
      'Darchula', 'Doti', 'Kailali', 'Kanchanpur'
    ]
  }
];

export const allDistricts = nepalProvinces.flatMap(p => p.districts).sort();
