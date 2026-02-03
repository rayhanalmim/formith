// Comprehensive list of cities and countries for location selection

export interface Location {
  value: string;
  labelEn: string;
  labelAr: string;
  country: string;
}

export const locations: Location[] = [
  // Saudi Arabia
  { value: 'riyadh-sa', labelEn: 'Riyadh, Saudi Arabia', labelAr: 'الرياض، السعودية', country: 'Saudi Arabia' },
  { value: 'jeddah-sa', labelEn: 'Jeddah, Saudi Arabia', labelAr: 'جدة، السعودية', country: 'Saudi Arabia' },
  { value: 'mecca-sa', labelEn: 'Mecca, Saudi Arabia', labelAr: 'مكة المكرمة، السعودية', country: 'Saudi Arabia' },
  { value: 'medina-sa', labelEn: 'Medina, Saudi Arabia', labelAr: 'المدينة المنورة، السعودية', country: 'Saudi Arabia' },
  { value: 'dammam-sa', labelEn: 'Dammam, Saudi Arabia', labelAr: 'الدمام، السعودية', country: 'Saudi Arabia' },
  { value: 'taif-sa', labelEn: 'Taif, Saudi Arabia', labelAr: 'الطائف، السعودية', country: 'Saudi Arabia' },
  { value: 'tabuk-sa', labelEn: 'Tabuk, Saudi Arabia', labelAr: 'تبوك، السعودية', country: 'Saudi Arabia' },
  { value: 'abha-sa', labelEn: 'Abha, Saudi Arabia', labelAr: 'أبها، السعودية', country: 'Saudi Arabia' },
  { value: 'khobar-sa', labelEn: 'Khobar, Saudi Arabia', labelAr: 'الخبر، السعودية', country: 'Saudi Arabia' },
  { value: 'buraidah-sa', labelEn: 'Buraidah, Saudi Arabia', labelAr: 'بريدة، السعودية', country: 'Saudi Arabia' },
  
  // UAE
  { value: 'dubai-ae', labelEn: 'Dubai, UAE', labelAr: 'دبي، الإمارات', country: 'UAE' },
  { value: 'abudhabi-ae', labelEn: 'Abu Dhabi, UAE', labelAr: 'أبوظبي، الإمارات', country: 'UAE' },
  { value: 'sharjah-ae', labelEn: 'Sharjah, UAE', labelAr: 'الشارقة، الإمارات', country: 'UAE' },
  { value: 'ajman-ae', labelEn: 'Ajman, UAE', labelAr: 'عجمان، الإمارات', country: 'UAE' },
  { value: 'rak-ae', labelEn: 'Ras Al Khaimah, UAE', labelAr: 'رأس الخيمة، الإمارات', country: 'UAE' },
  { value: 'fujairah-ae', labelEn: 'Fujairah, UAE', labelAr: 'الفجيرة، الإمارات', country: 'UAE' },
  
  // Egypt
  { value: 'cairo-eg', labelEn: 'Cairo, Egypt', labelAr: 'القاهرة، مصر', country: 'Egypt' },
  { value: 'alexandria-eg', labelEn: 'Alexandria, Egypt', labelAr: 'الإسكندرية، مصر', country: 'Egypt' },
  { value: 'giza-eg', labelEn: 'Giza, Egypt', labelAr: 'الجيزة، مصر', country: 'Egypt' },
  { value: 'luxor-eg', labelEn: 'Luxor, Egypt', labelAr: 'الأقصر، مصر', country: 'Egypt' },
  { value: 'aswan-eg', labelEn: 'Aswan, Egypt', labelAr: 'أسوان، مصر', country: 'Egypt' },
  { value: 'sharmelsheikh-eg', labelEn: 'Sharm El Sheikh, Egypt', labelAr: 'شرم الشيخ، مصر', country: 'Egypt' },
  { value: 'hurghada-eg', labelEn: 'Hurghada, Egypt', labelAr: 'الغردقة، مصر', country: 'Egypt' },
  
  // Jordan
  { value: 'amman-jo', labelEn: 'Amman, Jordan', labelAr: 'عمّان، الأردن', country: 'Jordan' },
  { value: 'zarqa-jo', labelEn: 'Zarqa, Jordan', labelAr: 'الزرقاء، الأردن', country: 'Jordan' },
  { value: 'irbid-jo', labelEn: 'Irbid, Jordan', labelAr: 'إربد، الأردن', country: 'Jordan' },
  { value: 'aqaba-jo', labelEn: 'Aqaba, Jordan', labelAr: 'العقبة، الأردن', country: 'Jordan' },
  { value: 'petra-jo', labelEn: 'Petra, Jordan', labelAr: 'البتراء، الأردن', country: 'Jordan' },
  
  // Kuwait
  { value: 'kuwait-kw', labelEn: 'Kuwait City, Kuwait', labelAr: 'مدينة الكويت، الكويت', country: 'Kuwait' },
  { value: 'hawalli-kw', labelEn: 'Hawalli, Kuwait', labelAr: 'حولي، الكويت', country: 'Kuwait' },
  { value: 'salmiya-kw', labelEn: 'Salmiya, Kuwait', labelAr: 'السالمية، الكويت', country: 'Kuwait' },
  
  // Qatar
  { value: 'doha-qa', labelEn: 'Doha, Qatar', labelAr: 'الدوحة، قطر', country: 'Qatar' },
  { value: 'lusail-qa', labelEn: 'Lusail, Qatar', labelAr: 'لوسيل، قطر', country: 'Qatar' },
  
  // Bahrain
  { value: 'manama-bh', labelEn: 'Manama, Bahrain', labelAr: 'المنامة، البحرين', country: 'Bahrain' },
  { value: 'riffa-bh', labelEn: 'Riffa, Bahrain', labelAr: 'الرفاع، البحرين', country: 'Bahrain' },
  
  // Oman
  { value: 'muscat-om', labelEn: 'Muscat, Oman', labelAr: 'مسقط، عُمان', country: 'Oman' },
  { value: 'salalah-om', labelEn: 'Salalah, Oman', labelAr: 'صلالة، عُمان', country: 'Oman' },
  { value: 'sohar-om', labelEn: 'Sohar, Oman', labelAr: 'صحار، عُمان', country: 'Oman' },
  
  // Lebanon
  { value: 'beirut-lb', labelEn: 'Beirut, Lebanon', labelAr: 'بيروت، لبنان', country: 'Lebanon' },
  { value: 'tripoli-lb', labelEn: 'Tripoli, Lebanon', labelAr: 'طرابلس، لبنان', country: 'Lebanon' },
  { value: 'sidon-lb', labelEn: 'Sidon, Lebanon', labelAr: 'صيدا، لبنان', country: 'Lebanon' },
  
  // Iraq
  { value: 'baghdad-iq', labelEn: 'Baghdad, Iraq', labelAr: 'بغداد، العراق', country: 'Iraq' },
  { value: 'basra-iq', labelEn: 'Basra, Iraq', labelAr: 'البصرة، العراق', country: 'Iraq' },
  { value: 'erbil-iq', labelEn: 'Erbil, Iraq', labelAr: 'أربيل، العراق', country: 'Iraq' },
  { value: 'mosul-iq', labelEn: 'Mosul, Iraq', labelAr: 'الموصل، العراق', country: 'Iraq' },
  { value: 'najaf-iq', labelEn: 'Najaf, Iraq', labelAr: 'النجف، العراق', country: 'Iraq' },
  
  // Syria
  { value: 'damascus-sy', labelEn: 'Damascus, Syria', labelAr: 'دمشق، سوريا', country: 'Syria' },
  { value: 'aleppo-sy', labelEn: 'Aleppo, Syria', labelAr: 'حلب، سوريا', country: 'Syria' },
  { value: 'homs-sy', labelEn: 'Homs, Syria', labelAr: 'حمص، سوريا', country: 'Syria' },
  
  // Palestine
  { value: 'ramallah-ps', labelEn: 'Ramallah, Palestine', labelAr: 'رام الله، فلسطين', country: 'Palestine' },
  { value: 'gaza-ps', labelEn: 'Gaza, Palestine', labelAr: 'غزة، فلسطين', country: 'Palestine' },
  { value: 'bethlehem-ps', labelEn: 'Bethlehem, Palestine', labelAr: 'بيت لحم، فلسطين', country: 'Palestine' },
  { value: 'nablus-ps', labelEn: 'Nablus, Palestine', labelAr: 'نابلس، فلسطين', country: 'Palestine' },
  { value: 'jerusalem-ps', labelEn: 'Jerusalem', labelAr: 'القدس', country: 'Palestine' },
  
  // Morocco
  { value: 'casablanca-ma', labelEn: 'Casablanca, Morocco', labelAr: 'الدار البيضاء، المغرب', country: 'Morocco' },
  { value: 'rabat-ma', labelEn: 'Rabat, Morocco', labelAr: 'الرباط، المغرب', country: 'Morocco' },
  { value: 'marrakech-ma', labelEn: 'Marrakech, Morocco', labelAr: 'مراكش، المغرب', country: 'Morocco' },
  { value: 'fes-ma', labelEn: 'Fes, Morocco', labelAr: 'فاس، المغرب', country: 'Morocco' },
  { value: 'tangier-ma', labelEn: 'Tangier, Morocco', labelAr: 'طنجة، المغرب', country: 'Morocco' },
  
  // Tunisia
  { value: 'tunis-tn', labelEn: 'Tunis, Tunisia', labelAr: 'تونس، تونس', country: 'Tunisia' },
  { value: 'sfax-tn', labelEn: 'Sfax, Tunisia', labelAr: 'صفاقس، تونس', country: 'Tunisia' },
  { value: 'sousse-tn', labelEn: 'Sousse, Tunisia', labelAr: 'سوسة، تونس', country: 'Tunisia' },
  
  // Algeria
  { value: 'algiers-dz', labelEn: 'Algiers, Algeria', labelAr: 'الجزائر، الجزائر', country: 'Algeria' },
  { value: 'oran-dz', labelEn: 'Oran, Algeria', labelAr: 'وهران، الجزائر', country: 'Algeria' },
  { value: 'constantine-dz', labelEn: 'Constantine, Algeria', labelAr: 'قسنطينة، الجزائر', country: 'Algeria' },
  
  // Libya
  { value: 'tripoli-ly', labelEn: 'Tripoli, Libya', labelAr: 'طرابلس، ليبيا', country: 'Libya' },
  { value: 'benghazi-ly', labelEn: 'Benghazi, Libya', labelAr: 'بنغازي، ليبيا', country: 'Libya' },
  
  // Sudan
  { value: 'khartoum-sd', labelEn: 'Khartoum, Sudan', labelAr: 'الخرطوم، السودان', country: 'Sudan' },
  { value: 'omdurman-sd', labelEn: 'Omdurman, Sudan', labelAr: 'أم درمان، السودان', country: 'Sudan' },
  
  // Yemen
  { value: 'sanaa-ye', labelEn: "Sana'a, Yemen", labelAr: 'صنعاء، اليمن', country: 'Yemen' },
  { value: 'aden-ye', labelEn: 'Aden, Yemen', labelAr: 'عدن، اليمن', country: 'Yemen' },
  
  // Turkey
  { value: 'istanbul-tr', labelEn: 'Istanbul, Turkey', labelAr: 'إسطنبول، تركيا', country: 'Turkey' },
  { value: 'ankara-tr', labelEn: 'Ankara, Turkey', labelAr: 'أنقرة، تركيا', country: 'Turkey' },
  { value: 'izmir-tr', labelEn: 'Izmir, Turkey', labelAr: 'إزمير، تركيا', country: 'Turkey' },
  { value: 'antalya-tr', labelEn: 'Antalya, Turkey', labelAr: 'أنطاليا، تركيا', country: 'Turkey' },
  { value: 'bursa-tr', labelEn: 'Bursa, Turkey', labelAr: 'بورصة، تركيا', country: 'Turkey' },
  
  // USA
  { value: 'newyork-us', labelEn: 'New York, USA', labelAr: 'نيويورك، أمريكا', country: 'USA' },
  { value: 'losangeles-us', labelEn: 'Los Angeles, USA', labelAr: 'لوس أنجلوس، أمريكا', country: 'USA' },
  { value: 'chicago-us', labelEn: 'Chicago, USA', labelAr: 'شيكاغو، أمريكا', country: 'USA' },
  { value: 'houston-us', labelEn: 'Houston, USA', labelAr: 'هيوستن، أمريكا', country: 'USA' },
  { value: 'miami-us', labelEn: 'Miami, USA', labelAr: 'ميامي، أمريكا', country: 'USA' },
  { value: 'sanfrancisco-us', labelEn: 'San Francisco, USA', labelAr: 'سان فرانسيسكو، أمريكا', country: 'USA' },
  { value: 'washington-us', labelEn: 'Washington D.C., USA', labelAr: 'واشنطن، أمريكا', country: 'USA' },
  { value: 'boston-us', labelEn: 'Boston, USA', labelAr: 'بوسطن، أمريكا', country: 'USA' },
  { value: 'seattle-us', labelEn: 'Seattle, USA', labelAr: 'سياتل، أمريكا', country: 'USA' },
  { value: 'dallas-us', labelEn: 'Dallas, USA', labelAr: 'دالاس، أمريكا', country: 'USA' },
  
  // UK
  { value: 'london-gb', labelEn: 'London, UK', labelAr: 'لندن، بريطانيا', country: 'UK' },
  { value: 'manchester-gb', labelEn: 'Manchester, UK', labelAr: 'مانشستر، بريطانيا', country: 'UK' },
  { value: 'birmingham-gb', labelEn: 'Birmingham, UK', labelAr: 'برمنغهام، بريطانيا', country: 'UK' },
  { value: 'edinburgh-gb', labelEn: 'Edinburgh, UK', labelAr: 'إدنبرة، بريطانيا', country: 'UK' },
  { value: 'liverpool-gb', labelEn: 'Liverpool, UK', labelAr: 'ليفربول، بريطانيا', country: 'UK' },
  
  // France
  { value: 'paris-fr', labelEn: 'Paris, France', labelAr: 'باريس، فرنسا', country: 'France' },
  { value: 'marseille-fr', labelEn: 'Marseille, France', labelAr: 'مارسيليا، فرنسا', country: 'France' },
  { value: 'lyon-fr', labelEn: 'Lyon, France', labelAr: 'ليون، فرنسا', country: 'France' },
  { value: 'nice-fr', labelEn: 'Nice, France', labelAr: 'نيس، فرنسا', country: 'France' },
  
  // Germany
  { value: 'berlin-de', labelEn: 'Berlin, Germany', labelAr: 'برلين، ألمانيا', country: 'Germany' },
  { value: 'munich-de', labelEn: 'Munich, Germany', labelAr: 'ميونخ، ألمانيا', country: 'Germany' },
  { value: 'frankfurt-de', labelEn: 'Frankfurt, Germany', labelAr: 'فرانكفورت، ألمانيا', country: 'Germany' },
  { value: 'hamburg-de', labelEn: 'Hamburg, Germany', labelAr: 'هامبورغ، ألمانيا', country: 'Germany' },
  { value: 'cologne-de', labelEn: 'Cologne, Germany', labelAr: 'كولونيا، ألمانيا', country: 'Germany' },
  
  // Italy
  { value: 'rome-it', labelEn: 'Rome, Italy', labelAr: 'روما، إيطاليا', country: 'Italy' },
  { value: 'milan-it', labelEn: 'Milan, Italy', labelAr: 'ميلانو، إيطاليا', country: 'Italy' },
  { value: 'naples-it', labelEn: 'Naples, Italy', labelAr: 'نابولي، إيطاليا', country: 'Italy' },
  { value: 'venice-it', labelEn: 'Venice, Italy', labelAr: 'البندقية، إيطاليا', country: 'Italy' },
  
  // Spain
  { value: 'madrid-es', labelEn: 'Madrid, Spain', labelAr: 'مدريد، إسبانيا', country: 'Spain' },
  { value: 'barcelona-es', labelEn: 'Barcelona, Spain', labelAr: 'برشلونة، إسبانيا', country: 'Spain' },
  { value: 'valencia-es', labelEn: 'Valencia, Spain', labelAr: 'فالنسيا، إسبانيا', country: 'Spain' },
  { value: 'seville-es', labelEn: 'Seville, Spain', labelAr: 'إشبيلية، إسبانيا', country: 'Spain' },
  
  // Netherlands
  { value: 'amsterdam-nl', labelEn: 'Amsterdam, Netherlands', labelAr: 'أمستردام، هولندا', country: 'Netherlands' },
  { value: 'rotterdam-nl', labelEn: 'Rotterdam, Netherlands', labelAr: 'روتردام، هولندا', country: 'Netherlands' },
  
  // Belgium
  { value: 'brussels-be', labelEn: 'Brussels, Belgium', labelAr: 'بروكسل، بلجيكا', country: 'Belgium' },
  
  // Switzerland
  { value: 'zurich-ch', labelEn: 'Zurich, Switzerland', labelAr: 'زيورخ، سويسرا', country: 'Switzerland' },
  { value: 'geneva-ch', labelEn: 'Geneva, Switzerland', labelAr: 'جنيف، سويسرا', country: 'Switzerland' },
  
  // Austria
  { value: 'vienna-at', labelEn: 'Vienna, Austria', labelAr: 'فيينا، النمسا', country: 'Austria' },
  
  // Sweden
  { value: 'stockholm-se', labelEn: 'Stockholm, Sweden', labelAr: 'ستوكهولم، السويد', country: 'Sweden' },
  
  // Norway
  { value: 'oslo-no', labelEn: 'Oslo, Norway', labelAr: 'أوسلو، النرويج', country: 'Norway' },
  
  // Denmark
  { value: 'copenhagen-dk', labelEn: 'Copenhagen, Denmark', labelAr: 'كوبنهاغن، الدنمارك', country: 'Denmark' },
  
  // Canada
  { value: 'toronto-ca', labelEn: 'Toronto, Canada', labelAr: 'تورونتو، كندا', country: 'Canada' },
  { value: 'vancouver-ca', labelEn: 'Vancouver, Canada', labelAr: 'فانكوفر، كندا', country: 'Canada' },
  { value: 'montreal-ca', labelEn: 'Montreal, Canada', labelAr: 'مونتريال، كندا', country: 'Canada' },
  { value: 'ottawa-ca', labelEn: 'Ottawa, Canada', labelAr: 'أوتاوا، كندا', country: 'Canada' },
  
  // Australia
  { value: 'sydney-au', labelEn: 'Sydney, Australia', labelAr: 'سيدني، أستراليا', country: 'Australia' },
  { value: 'melbourne-au', labelEn: 'Melbourne, Australia', labelAr: 'ملبورن، أستراليا', country: 'Australia' },
  { value: 'brisbane-au', labelEn: 'Brisbane, Australia', labelAr: 'بريزبن، أستراليا', country: 'Australia' },
  { value: 'perth-au', labelEn: 'Perth, Australia', labelAr: 'بيرث، أستراليا', country: 'Australia' },
  
  // Japan
  { value: 'tokyo-jp', labelEn: 'Tokyo, Japan', labelAr: 'طوكيو، اليابان', country: 'Japan' },
  { value: 'osaka-jp', labelEn: 'Osaka, Japan', labelAr: 'أوساكا، اليابان', country: 'Japan' },
  { value: 'kyoto-jp', labelEn: 'Kyoto, Japan', labelAr: 'كيوتو، اليابان', country: 'Japan' },
  
  // South Korea
  { value: 'seoul-kr', labelEn: 'Seoul, South Korea', labelAr: 'سيول، كوريا الجنوبية', country: 'South Korea' },
  { value: 'busan-kr', labelEn: 'Busan, South Korea', labelAr: 'بوسان، كوريا الجنوبية', country: 'South Korea' },
  
  // China
  { value: 'beijing-cn', labelEn: 'Beijing, China', labelAr: 'بكين، الصين', country: 'China' },
  { value: 'shanghai-cn', labelEn: 'Shanghai, China', labelAr: 'شنغهاي، الصين', country: 'China' },
  { value: 'hongkong-cn', labelEn: 'Hong Kong', labelAr: 'هونغ كونغ', country: 'China' },
  { value: 'guangzhou-cn', labelEn: 'Guangzhou, China', labelAr: 'غوانزو، الصين', country: 'China' },
  { value: 'shenzhen-cn', labelEn: 'Shenzhen, China', labelAr: 'شنزن، الصين', country: 'China' },
  
  // India
  { value: 'mumbai-in', labelEn: 'Mumbai, India', labelAr: 'مومباي، الهند', country: 'India' },
  { value: 'delhi-in', labelEn: 'New Delhi, India', labelAr: 'نيودلهي، الهند', country: 'India' },
  { value: 'bangalore-in', labelEn: 'Bangalore, India', labelAr: 'بنغالور، الهند', country: 'India' },
  { value: 'chennai-in', labelEn: 'Chennai, India', labelAr: 'تشيناي، الهند', country: 'India' },
  { value: 'hyderabad-in', labelEn: 'Hyderabad, India', labelAr: 'حيدر أباد، الهند', country: 'India' },
  
  // Singapore
  { value: 'singapore-sg', labelEn: 'Singapore', labelAr: 'سنغافورة', country: 'Singapore' },
  
  // Malaysia
  { value: 'kualalumpur-my', labelEn: 'Kuala Lumpur, Malaysia', labelAr: 'كوالالمبور، ماليزيا', country: 'Malaysia' },
  
  // Thailand
  { value: 'bangkok-th', labelEn: 'Bangkok, Thailand', labelAr: 'بانكوك، تايلاند', country: 'Thailand' },
  
  // Indonesia
  { value: 'jakarta-id', labelEn: 'Jakarta, Indonesia', labelAr: 'جاكرتا، إندونيسيا', country: 'Indonesia' },
  { value: 'bali-id', labelEn: 'Bali, Indonesia', labelAr: 'بالي، إندونيسيا', country: 'Indonesia' },
  
  // Philippines
  { value: 'manila-ph', labelEn: 'Manila, Philippines', labelAr: 'مانيلا، الفلبين', country: 'Philippines' },
  
  // Pakistan
  { value: 'karachi-pk', labelEn: 'Karachi, Pakistan', labelAr: 'كراتشي، باكستان', country: 'Pakistan' },
  { value: 'lahore-pk', labelEn: 'Lahore, Pakistan', labelAr: 'لاهور، باكستان', country: 'Pakistan' },
  { value: 'islamabad-pk', labelEn: 'Islamabad, Pakistan', labelAr: 'إسلام آباد، باكستان', country: 'Pakistan' },
  
  // Bangladesh
  { value: 'dhaka-bd', labelEn: 'Dhaka, Bangladesh', labelAr: 'دكا، بنغلاديش', country: 'Bangladesh' },
  
  // Russia
  { value: 'moscow-ru', labelEn: 'Moscow, Russia', labelAr: 'موسكو، روسيا', country: 'Russia' },
  { value: 'stpetersburg-ru', labelEn: 'St. Petersburg, Russia', labelAr: 'سانت بطرسبرغ، روسيا', country: 'Russia' },
  
  // Brazil
  { value: 'saopaulo-br', labelEn: 'São Paulo, Brazil', labelAr: 'ساو باولو، البرازيل', country: 'Brazil' },
  { value: 'riodejaneiro-br', labelEn: 'Rio de Janeiro, Brazil', labelAr: 'ريو دي جانيرو، البرازيل', country: 'Brazil' },
  
  // Argentina
  { value: 'buenosaires-ar', labelEn: 'Buenos Aires, Argentina', labelAr: 'بوينس آيرس، الأرجنتين', country: 'Argentina' },
  
  // Mexico
  { value: 'mexicocity-mx', labelEn: 'Mexico City, Mexico', labelAr: 'مكسيكو سيتي، المكسيك', country: 'Mexico' },
  { value: 'cancun-mx', labelEn: 'Cancun, Mexico', labelAr: 'كانكون، المكسيك', country: 'Mexico' },
  
  // South Africa
  { value: 'johannesburg-za', labelEn: 'Johannesburg, South Africa', labelAr: 'جوهانسبرغ، جنوب أفريقيا', country: 'South Africa' },
  { value: 'capetown-za', labelEn: 'Cape Town, South Africa', labelAr: 'كيب تاون، جنوب أفريقيا', country: 'South Africa' },
  
  // Nigeria
  { value: 'lagos-ng', labelEn: 'Lagos, Nigeria', labelAr: 'لاغوس، نيجيريا', country: 'Nigeria' },
  { value: 'abuja-ng', labelEn: 'Abuja, Nigeria', labelAr: 'أبوجا، نيجيريا', country: 'Nigeria' },
  
  // Kenya
  { value: 'nairobi-ke', labelEn: 'Nairobi, Kenya', labelAr: 'نيروبي، كينيا', country: 'Kenya' },
  
  // Ethiopia
  { value: 'addisababa-et', labelEn: 'Addis Ababa, Ethiopia', labelAr: 'أديس أبابا، إثيوبيا', country: 'Ethiopia' },
  
  // Greece
  { value: 'athens-gr', labelEn: 'Athens, Greece', labelAr: 'أثينا، اليونان', country: 'Greece' },
  
  // Portugal
  { value: 'lisbon-pt', labelEn: 'Lisbon, Portugal', labelAr: 'لشبونة، البرتغال', country: 'Portugal' },
  
  // Poland
  { value: 'warsaw-pl', labelEn: 'Warsaw, Poland', labelAr: 'وارسو، بولندا', country: 'Poland' },
  { value: 'krakow-pl', labelEn: 'Krakow, Poland', labelAr: 'كراكوف، بولندا', country: 'Poland' },
  
  // Ireland
  { value: 'dublin-ie', labelEn: 'Dublin, Ireland', labelAr: 'دبلن، أيرلندا', country: 'Ireland' },
  
  // New Zealand
  { value: 'auckland-nz', labelEn: 'Auckland, New Zealand', labelAr: 'أوكلاند، نيوزيلندا', country: 'New Zealand' },
  { value: 'wellington-nz', labelEn: 'Wellington, New Zealand', labelAr: 'ولينغتون، نيوزيلندا', country: 'New Zealand' },
];

// Function to filter locations based on search query
export function filterLocations(query: string, language: 'en' | 'ar'): Location[] {
  if (!query.trim()) {
    return locations.slice(0, 20); // Return first 20 if no query
  }
  
  const lowerQuery = query.toLowerCase();
  
  return locations.filter(loc => {
    const labelToSearch = language === 'ar' ? loc.labelAr : loc.labelEn;
    return labelToSearch.toLowerCase().includes(lowerQuery) ||
           loc.country.toLowerCase().includes(lowerQuery);
  }).slice(0, 20); // Limit results
}
