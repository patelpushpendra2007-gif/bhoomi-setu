export const FARMER_LANGUAGES = [
  {
    code: 'hi',
    speechLang: 'hi-IN',
    label: 'हिन्दी (Hindi)',
    appTitle: 'भूमि-ट्रैकर किसान ऐप',
    voiceBtn: 'आवाज़ से सुनें',
    parcelLabel: 'भूखंड / ULPIN',
    awardLabel: 'कुल मुआवज़ा राशि',
    annuityLabel: 'मासिक जीवनयापन भत्ता (24 माह)',
    signBtn: 'आधार VID से डिजिटल सहमति (e-Sign) दें',
    signedBadge: 'आधार VID सहमति सत्यापित',
    grievanceBtn: 'Sec 15 आपत्ति / 7-दिन DM शिकायत',
    stages: [
      'ULPIN सूचना (जियोटैग + SMS/IVRS)',
      'डिजिटल सहमति (आधार VID e-Sign)',
      'Schedule I अवॉर्ड (100% सोलेशियम + 12%)',
      '24-घंटे PFMS बैंक क्रेडिट + RoR म्यूटेशन',
      '24-माह भत्ता व PMKVY 4.0 कौशल सेतु'
    ],
    voiceSummary: (p, amt, ann) =>
      `नमस्ते ${p.farmerName} जी। आपका ${p.parcelNumber} परियोजना के लिए चिन्हित है। कुल मुआवज़ा ${amt} रुपये और 24 महीने तक ${ann} रुपये प्रति माह भत्ता तय है।`
  },
  {
    code: 'en',
    speechLang: 'en-IN',
    label: 'English',
    appTitle: 'BhoomiTracker Citizen App',
    voiceBtn: 'Listen Voice Guide',
    parcelLabel: 'Parcel / ULPIN',
    awardLabel: 'Total Compensation Award',
    annuityLabel: 'Transition Annuity (24 Mo)',
    signBtn: 'Sign Digital Consent (Aadhaar VID)',
    signedBadge: 'Aadhaar VID Consent Verified',
    grievanceBtn: 'File Sec 15 Objection (7–15d Triage)',
    stages: [
      'ULPIN Notice (GIS + Vernacular SMS)',
      'e-Sign Consent (UIDAI VID / CSC)',
      'Award Sheet (RFCTLARR Schedule I)',
      '24-Hr PFMS Credit + DILRMP Mutation',
      'Annuity Bridge & PMKVY 4.0 R&R'
    ],
    voiceSummary: (p, amt, ann) =>
      `Hello ${p.farmerName}. Your land parcel ${p.parcelNumber} with ULPIN ${p.ulpin} has a net award of rupees ${amt}, plus rupees ${ann} monthly transition annuity for 24 months.`
  },
  {
    code: 'mr',
    speechLang: 'mr-IN',
    label: 'मराठी (Marathi)',
    appTitle: 'भूमी-ट्रॅकर शेतकरी अ‍ॅप',
    voiceBtn: 'आवाजात माहिती ऐका',
    parcelLabel: 'सातबारा / ULPIN',
    awardLabel: 'एकूण नुकसान भरपाई',
    annuityLabel: 'मासिक निर्वाह भत्ता (२४ महिने)',
    signBtn: 'आधार VID द्वारे डिजिटल संमती (e-Sign) द्या',
    signedBadge: 'आधार VID संमती सत्यापित',
    grievanceBtn: 'Sec 15 हरकत / ७-दिवस DM तक्रार',
    stages: [
      'ULPIN नोटीस (GIS मॅपिंग)',
      'डिजिटल संमती (आधार VID e-Sign)',
      'Schedule I मोबदला पत्रक',
      '२४ तासांत PFMS बँक जमा + महाभूलेख नोंद',
      '२४-महिने भत्ता व PMKVY 4.0 प्रशिक्षण'
    ],
    voiceSummary: (p, amt, ann) =>
      `नमस्कार ${p.farmerName}. तुमच्या ${p.parcelNumber} साठी एकूण ${amt} रुपये भरपाई आणि २४ महिन्यांसाठी दरमहा ${ann} रुपये भत्ता मंजूर आहे.`
  },
  {
    code: 'pa',
    speechLang: 'pa-IN',
    label: 'ਪੰਜਾਬੀ (Punjabi)',
    appTitle: 'ਭੂਮੀ-ਟ੍ਰੈਕਰ ਕਿਸਾਨ ਐਪ',
    voiceBtn: 'ਆਵਾਜ਼ ਵਿੱਚ ਸੁਣੋ',
    parcelLabel: 'ਖਸਰਾ / ULPIN',
    awardLabel: 'ਕੁੱਲ ਮੁਆਵਜ਼ਾ ਰਕਮ',
    annuityLabel: 'ਮਹੀਨਾਵਾਰ ਗੁਜ਼ਾਰਾ ਭੱਤਾ (24 ਮਹੀਨੇ)',
    signBtn: 'ਆਧਾਰ VID ਰਾਹੀਂ ਡਿਜੀਟਲ ਸਹਿਮਤੀ ਦਿਓ',
    signedBadge: 'ਆਧਾਰ VID ਸਹਿਮਤੀ ਤਸਦੀਕ',
    grievanceBtn: 'Sec 15 ਇਤਰਾਜ਼ / 7-ਦਿਨ DM ਸ਼ਿਕਾਇਤ',
    stages: [
      'ULPIN ਜੀਓਟੈਗ ਨੋਟਿਸ',
      'ਡਿਜੀਟਲ ਸਹਿਮਤੀ (ਆਧਾਰ VID e-Sign)',
      'Schedule I ਮੁਆਵਜ਼ਾ ਗਣਨਾ',
      '24-ਘੰਟੇ PFMS ਬੈਂਕ ਟ੍ਰਾਂਸਫਰ',
      '24-ਮਹੀਨੇ ਭੱਤਾ ਅਤੇ PMKVY 4.0 ਹੁਨਰ'
    ],
    voiceSummary: (p, amt, ann) =>
      `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${p.farmerName} ਜੀ। ਤੁਹਾਡੀ ਜ਼ਮੀਨ ${p.parcelNumber} ਲਈ ${amt} ਰੁਪਏ ਮੁਆਵਜ਼ਾ ਅਤੇ ${ann} ਰੁਪਏ ਮਹੀਨਾਵਾਰ ਭੱਤਾ ਮਨਜ਼ੂਰ ਹੈ।`
  },
  {
    code: 'ta',
    speechLang: 'ta-IN',
    label: 'தமிழ் (Tamil)',
    appTitle: 'பூமி-டிராக்கர் விவசாயி செயலி',
    voiceBtn: 'குரல் வழிகாட்டி கேட்க',
    parcelLabel: 'பட்டா / ULPIN',
    awardLabel: 'மொத்த இழப்பீட்டுத் தொகை',
    annuityLabel: 'மாதாந்திர வாழ்வாதார உதவி (24 மாதம்)',
    signBtn: 'ஆதார் VID மூலம் டிஜிட்டல் ஒப்புதல் வழங்கவும்',
    signedBadge: 'ஆதார் VID ஒப்புதல் உறுதி',
    grievanceBtn: 'Sec 15 ஆட்சேபனை / 7-நாள் DM புகார்',
    stages: [
      'ULPIN புவிக்குறியீடு அறிவிப்பு',
      'டிஜிட்டல் ஒப்புதல் (Aadhaar VID)',
      'Schedule I இழப்பீடு கணக்கீடு',
      '24-மணி PFMS நேரடி வங்கிப் பரிமாற்றம்',
      'மாதாந்திர ஓய்வூதியம் & PMKVY 4.0'
    ],
    voiceSummary: (p, amt, ann) =>
      `வணக்கம் ${p.farmerName}. உங்கள் ${p.parcelNumber} நிலத்திற்கு ரூபாய் ${amt} இழப்பீடு மற்றும் மாதம் ரூபாய் ${ann} உதவித்தொகை ஒதுக்கப்பட்டுள்ளது.`
  },
  {
    code: 'te',
    speechLang: 'te-IN',
    label: 'తెలుగు (Telugu)',
    appTitle: 'భూమి-ట్రాకర్ రైతు యాప్',
    voiceBtn: 'వాయిస్ గైడ్ వినండి',
    parcelLabel: 'సర్వే / ULPIN',
    awardLabel: 'మొత్తం పరిహారం',
    annuityLabel: 'నెలవారీ భృతి (24 నెలలు)',
    signBtn: 'ఆధార్ VID తో డిజిటల్ సమ్మతి (e-Sign)',
    signedBadge: 'ఆధార్ VID సమ్మతి ధృవీకరించబడింది',
    grievanceBtn: 'Sec 15 అభ్యంతరం / 7-రోజుల ఫిర్యాదు',
    stages: [
      'ULPIN జియోట్యాగ్ నోటీసు',
      'డిజిటల్ సమ్మతి (Aadhaar VID)',
      'Schedule I పరిహారం లెక్కింపు',
      '24-గం PFMS DBT బ్యాంక్ జమ',
      'నెలవారీ పెన్షన్ & PMKVY 4.0'
    ],
    voiceSummary: (p, amt, ann) =>
      `నమస్కారం ${p.farmerName} గారు. మీ ${p.parcelNumber} భూమికి రూపాయలు ${amt} పరిహారం మరియు నెలకు ${ann} భృతి మంజూరైంది.`
  },
  {
    code: 'bn',
    speechLang: 'bn-IN',
    label: 'বাংলা (Bengali)',
    appTitle: 'ভূমি-ট্র্যাকার কৃষক অ্যাপ',
    voiceBtn: 'ভয়েস গাইড শুনুন',
    parcelLabel: 'খতিয়ান / ULPIN',
    awardLabel: 'মোট ক্ষতিপূরণের পরিমাণ',
    annuityLabel: 'মাসিক জীবিকা ভাতা (২৪ মাস)',
    signBtn: 'আধার VID দ্বারা ডিজিটাল সম্মতি দিন',
    signedBadge: 'আধার VID সম্মতি যাচাইকৃত',
    grievanceBtn: 'Sec 15 আপত্তি / ৭-দিন DM অভিযোগ',
    stages: [
      'ULPIN জিওট্যাগ নোটিশ',
      'ডিজিটাল সম্মতি (Aadhaar VID)',
      'Schedule I ক্ষতিপূরণ হিসাব',
      '২৪-ঘন্টা PFMS ব্যাংক ট্রান্সফার',
      'মাসিক ভাতা ও PMKVY 4.0 প্রশিক্ষণ'
    ],
    voiceSummary: (p, amt, ann) =>
      `নমস্কার ${p.farmerName}। আপনার ${p.parcelNumber} জমির জন্য ${amt} টাকা ক্ষতিপূরণ এবং মাসে ${ann} টাকা ভাতা নির্ধারিত হয়েছে।`
  },
  {
    code: 'gu',
    speechLang: 'gu-IN',
    label: 'ગુજરાતી (Gujarati)',
    appTitle: 'ભૂમિ-ટ્રેકર ખેડૂત એપ',
    voiceBtn: 'અવાજ દ્વારા સાંભળો',
    parcelLabel: 'સર્વે / ULPIN',
    awardLabel: 'કુલ વળતર રકમ',
    annuityLabel: 'માસિક જીવનનિર્વાહ ભથ્થું (24 માસ)',
    signBtn: 'આધાર VID થી ડિજિટલ સંમતિ આપો',
    signedBadge: 'આધાર VID સંમતિ ચકાસાયેલ',
    grievanceBtn: 'Sec 15 વાંધો / 7-દિવસ DM ફરિયાદ',
    stages: [
      'ULPIN જિયોટેગ નોટિસ',
      'ડિજિટલ સંમતિ (Aadhaar VID)',
      'Schedule I વળતર ગણતરી',
      '24-કલાક PFMS બેંક ટ્રાન્સફર',
      'માસિક સહાય અને PMKVY 4.0'
    ],
    voiceSummary: (p, amt, ann) =>
      `નમસ્તે ${p.farmerName}. તમારા ${p.parcelNumber} માટે ${amt} રૂપિયા વળતર અને દર મહિને ${ann} રૂપિયા સહાય મંજૂર છે.`
  },
  {
    code: 'kn',
    speechLang: 'kn-IN',
    label: 'ಕನ್ನಡ (Kannada)',
    appTitle: 'ಭೂಮಿ-ಟ್ರ್ಯಾಕರ್ ರೈತ ಆ್ಯಪ್',
    voiceBtn: 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ ಕೇಳಿ',
    parcelLabel: 'ಸರ್ವೆ / ULPIN',
    awardLabel: 'ಒಟ್ಟು ಪರಿಹಾರ ಮೊತ್ತ',
    annuityLabel: 'ಮಾಸಿಕ ಜೀವನ ಭತ್ಯೆ (24 ತಿಂಗಳು)',
    signBtn: 'ಆಧಾರ್ VID ಮೂಲಕ ಡಿಜಿಟಲ್ ಒಪ್ಪಿಗೆ ನೀಡಿ',
    signedBadge: 'ಆಧಾರ್ VID ಒಪ್ಪಿಗೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    grievanceBtn: 'Sec 15 ಆಕ್ಷೇಪಣೆ / 7-ದಿನ ದೂರು',
    stages: [
      'ULPIN ಜಿಯೋಟ್ಯಾಗ್ ಸೂಚನೆ',
      'ಡಿಜಿಟಲ್ ಒಪ್ಪಿಗೆ (Aadhaar VID)',
      'Schedule I ಪರಿಹಾರ ಲೆಕ್ಕಾಚಾರ',
      '24-ಗಂ PFMS ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ',
      'ಮಾಸಿಕ ಭತ್ಯೆ ಮತ್ತು PMKVY 4.0'
    ],
    voiceSummary: (p, amt, ann) =>
      `ನಮಸ್ಕಾರ ${p.farmerName}. ನಿಮ್ಮ ${p.parcelNumber} ಜಮೀನಿಗೆ ರೂಪಾಯಿ ${amt} ಪರಿಹಾರ ಮತ್ತು ಮಾಸಿಕ ${ann} ಭತ್ಯೆ ಮಂಜೂರಾಗಿದೆ.`
  },
  {
    code: 'ml',
    speechLang: 'ml-IN',
    label: 'മലയാളം (Malayalam)',
    appTitle: 'ഭൂമി-ട്രാക്കർ കർഷക ആപ്പ്',
    voiceBtn: 'ശബ്ദ സഹായി കേൾക്കുക',
    parcelLabel: 'സർവേ / ULPIN',
    awardLabel: 'ആകെ നഷ്ടപരിഹാര തുക',
    annuityLabel: 'പ്രതിമാസ ജീവനാംശം (24 മാസം)',
    signBtn: 'ആധാർ VID വഴി ഡിജിറ്റൽ സമ്മതം നൽകുക',
    signedBadge: 'ആധാർ VID സമ്മതം സാധൂകരിച്ചു',
    grievanceBtn: 'Sec 15 പരാതി / 7-ദിവസം DM',
    stages: [
      'ULPIN ജിയോടാഗ് നോട്ടീസ്',
      'ഡിജിറ്റൽ സമ്മതം (Aadhaar VID)',
      'Schedule I നഷ്ടപരിഹാരം',
      '24-മണി PFMS ബാങ്ക് ട്രാൻസ്ഫർ',
      'പ്രതിമാസ പെൻഷനും PMKVY 4.0'
    ],
    voiceSummary: (p, amt, ann) =>
      `നമസ്കാരം ${p.farmerName}. നിങ്ങളുടെ ${p.parcelNumber} ഭൂമിക്ക് ${amt} രൂപ നഷ്ടപരിഹാരവും പ്രതിമാസം ${ann} രൂപ പെൻഷനും അനുവദിച്ചിട്ടുണ്ട്.`
  },
  {
    code: 'or',
    speechLang: 'or-IN',
    label: 'ଓଡ଼ିଆ (Odia)',
    appTitle: 'ଭୂମି-ଟ୍ରାକର କୃଷକ ଆପ୍',
    voiceBtn: 'ଭଏସ୍ ଗାଇଡ୍ ଶୁଣନ୍ତୁ',
    parcelLabel: 'ଖାତା / ULPIN',
    awardLabel: 'ମୋଟ କ୍ଷତିପୂରଣ ରାଶି',
    annuityLabel: 'ମାସିକ ଭତ୍ତା (୨୪ ମାସ)',
    signBtn: 'ଆଧାର VID ଦ୍ୱାରା ଡିଜିଟାଲ୍ ସମ୍ମତି ଦିଅନ୍ତୁ',
    signedBadge: 'ଆଧାର VID ସମ୍ମତି ଯାଞ୍ଚ ହୋଇଛି',
    grievanceBtn: 'Sec 15 ଆପତ୍ତି / ୭-ଦିନ DM ଅଭିଯୋଗ',
    stages: [
      'ULPIN ଜିଓଟ୍ୟାଗ୍ ସୂଚନା',
      'ଡିଜିଟାଲ୍ ସମ୍ମତି (Aadhaar VID)',
      'Schedule I କ୍ଷତିପୂରଣ ହିସାବ',
      '୨୪-ଘଣ୍ଟା PFMS ବ୍ୟାଙ୍କ ଟ୍ରାନ୍ସଫର୍',
      'ମାସିକ ଭତ୍ତା ଓ PMKVY 4.0'
    ],
    voiceSummary: (p, amt, ann) =>
      `ନମସ୍କାର ${p.farmerName} । ଆପଣଙ୍କ ${p.parcelNumber} ପାଇଁ ${amt} ଟଙ୍କା କ୍ଷତିପୂରଣ ଓ ମାସିକ ${ann} ଟଙ୍କା ଭତ୍ତା ମଞ୍ଜୁର ହୋଇଛି ।`
  },
  {
    code: 'as',
    speechLang: 'as-IN',
    label: 'অসমীয়া (Assamese)',
    appTitle: 'ভূমি-ট্ৰেকাৰ কৃষক এপ',
    voiceBtn: 'ভইচ গাইড শুনক',
    parcelLabel: 'দাগ / ULPIN',
    awardLabel: 'মুঠ ক্ষতিপূৰণৰ পৰিমাণ',
    annuityLabel: 'মাহিলী জীৱিকা ভাট্টা (২৪ মাহ)',
    signBtn: 'আধাৰ VID ৰ জৰিয়তে ডিজিটেল সন্মতি দিয়ক',
    signedBadge: 'আধাৰ VID সন্মতি নিশ্চিত',
    grievanceBtn: 'Sec 15 আপত্তি / ৭-দিন DM অভিযোগ',
    stages: [
      'ULPIN জিঅ’টেগ জাননী',
      'ডিজিটেল সন্মতি (Aadhaar VID)',
      'Schedule I ক্ষতিপূৰণ হিচাপ',
      '২৪-ঘণ্টা PFMS বেংক ট্ৰেন্সফাৰ',
      'মাহিলী ভাট্টা আৰু PMKVY 4.0'
    ],
    voiceSummary: (p, amt, ann) =>
      `নমস্কাৰ ${p.farmerName}। আপোনাৰ ${p.parcelNumber} মাটিৰ বাবে ${amt} টকা ক্ষতিপূৰণ আৰু মাহিলী ${ann} টকা ভাট্টা মঞ্জুৰ কৰা হৈছে।`
  }
];

export const DEFENSE_QA = [
  {
    cat: 'Architecture (Slide 06)',
    q: 'Why lightweight SHA-256 hash-chained audit logs instead of Hyperledger Fabric?',
    a: 'Heavy consortium blockchains introduce node consensus bloat and latency across 36 state systems. BhoomiSetu uses ULPIN (Bhu-Aadhaar) + MeghRaj NIC Cloud + deterministic SHA-256 hash chaining + HMAC-signed UIDAI VID receipts—delivering cryptographic tamper detection with RPO < 5 min and 99.95% uptime.'
  },
  {
    cat: 'Legal Compliance (Slide 05 & 09)',
    q: 'How does BhoomiSetu compress 4.5 years to 6–9 months without violating RFCTLARR 2013?',
    a: 'It strictly honors Parliament’s Section 4 SIA, Section 11 notice, Section 15 (60-day objection window), and Schedule I math. Speed comes from eliminating ~18 months of manual Tehsil paper movement, instant ULPIN/Bhuvan boundary extraction, 7–15 day CALA triage, and Section 77 Escrow isolation.'
  },
  {
    cat: 'Constitutional / Writ Stays (Slide 05)',
    q: 'Does Section 77 Escrow Isolation block a citizen’s Article 226 High Court rights?',
    a: 'No. Software never restricts constitutional writ access. Instead, Section 77 deposits the disputed parcel’s full award (e.g., Khasra #403) in Digital Court Escrow while allowing undisputed corridor segments to clear—cutting project-wide corridor halts by 75–85%.'
  },
  {
    cat: 'Livelihood & R&R (Slide 07 & 08)',
    q: 'How does BhoomiSetu prevent rural distress debt after crop-income stops on Day 1?',
    a: 'Through a 3-Tier Safety Net built on Schedule II: (1) 24-hour PFMS direct bank credit with automated NeSL lien settlement, (2) 24-month Transition Annuity (₹8,000–₹15,000/mo), and (3) Official PMKVY 4.0 (Skill India / NSDC) skilling & contractor hiring preference.'
  },
  {
    cat: 'Last-Mile Inclusion (Slide 07 & 11)',
    q: 'How do elderly or non-smartphone farmers participate without middlemen?',
    a: 'Automated feature-phone SMS & toll-free IVRS voice callbacks in 12+ Indian languages reach basic phones offline, backed by village-level CSC Bhoomi Mitras for biometric/OTP e-Sign and offline PWA field sync.'
  },
  {
    cat: 'Public ROI (Slide 10)',
    q: 'How is ₹183.5 Cr net savings per ₹1,000 Cr project reconciled?',
    a: 'Manual acquisition averages ₹195.0 Cr in overhead (₹180 Cr delay interest/EPC escalation + ₹15 Cr survey/admin). BhoomiSetu reduces overhead to ₹11.5 Cr (₹5 Cr delay + ₹3 Cr GIS admin + ₹3.5 Cr avg 0.35% PSU SaaS fee), unlocking ₹183.5 Cr net savings (52.4x ROI; ₹0 for farmers).'
  }
];
