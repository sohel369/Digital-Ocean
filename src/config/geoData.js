/**
 * Structured Geographic Data for Supported Countries
 * Includes: States/Provinces/Regions and Postcode Validation Regex
 * Data sourced from standard international administrative divisions.
 */

export const GEO_DATA = {
    US: {
        name: 'United States',
        regions: [
            { name: 'Alabama', code: 'AL', population: 5108468, land_area: 50645, density: 100.9 },
            { name: 'Alaska', code: 'AK', population: 733406, land_area: 570641, density: 1.3 },
            { name: 'Arizona', code: 'AZ', population: 7431344, land_area: 113594, density: 65.4 },
            { name: 'Arkansas', code: 'AR', population: 3067732, land_area: 52035, density: 58.9 },
            { name: 'California', code: 'CA', population: 39237836, land_area: 155779, density: 251.9 },
            { name: 'Colorado', code: 'CO', population: 5877610, land_area: 103642, density: 56.7 },
            { name: 'Connecticut', code: 'CT', population: 3617176, land_area: 4842, density: 747.0 },
            { name: 'Delaware', code: 'DE', population: 1031890, land_area: 1949, density: 529.4 },
            { name: 'Florida', code: 'FL', population: 22610726, land_area: 53625, density: 421.6 },
            { name: 'Georgia', code: 'GA', population: 11029227, land_area: 57513, density: 191.8 },
            { name: 'Hawaii', code: 'HI', population: 1435138, land_area: 6423, density: 223.4 },
            { name: 'Idaho', code: 'ID', population: 1964726, land_area: 82643, density: 23.8 },
            { name: 'Illinois', code: 'IL', population: 12549689, land_area: 55519, density: 226.0 },
            { name: 'Indiana', code: 'IN', population: 6862199, land_area: 35826, density: 191.5 },
            { name: 'Iowa', code: 'IA', population: 3207004, land_area: 55857, density: 57.4 },
            { name: 'Kansas', code: 'KS', population: 2940546, land_area: 81759, density: 36.0 },
            { name: 'Kentucky', code: 'KY', population: 4526154, land_area: 39486, density: 114.6 },
            { name: 'Louisiana', code: 'LA', population: 4573749, land_area: 43204, density: 105.9 },
            { name: 'Maine', code: 'ME', population: 1395722, land_area: 30843, density: 45.3 },
            { name: 'Maryland', code: 'MD', population: 6180253, land_area: 9707, density: 636.7 },
            { name: 'Massachusetts', code: 'MA', population: 7001399, land_area: 7800, density: 897.6 },
            { name: 'Michigan', code: 'MI', population: 10037218, land_area: 56539, density: 177.5 },
            { name: 'Minnesota', code: 'MN', population: 5737915, land_area: 79627, density: 72.0 },
            { name: 'Mississippi', code: 'MS', population: 2940231, land_area: 46923, density: 62.7 },
            { name: 'Missouri', code: 'MO', population: 6196156, land_area: 68742, density: 90.1 },
            { name: 'Montana', code: 'MT', population: 1132812, land_area: 145546, density: 7.8 },
            { name: 'Nebraska', code: 'NE', population: 1978379, land_area: 76824, density: 25.8 },
            { name: 'Nevada', code: 'NV', population: 3194176, land_area: 109781, density: 29.1 },
            { name: 'New Hampshire', code: 'NH', population: 1402054, land_area: 8953, density: 156.6 },
            { name: 'New Jersey', code: 'NJ', population: 9290841, land_area: 7354, density: 1263.0 },
            { name: 'New Mexico', code: 'NM', population: 2114371, land_area: 121298, density: 17.4 },
            { name: 'New York', code: 'NY', population: 19571216, land_area: 47126, density: 415.3 },
            { name: 'North Carolina', code: 'NC', population: 10835491, land_area: 48618, density: 222.9 },
            { name: 'North Dakota', code: 'ND', population: 783926, land_area: 69001, density: 11.4 },
            { name: 'Ohio', code: 'OH', population: 11785935, land_area: 40861, density: 288.4 },
            { name: 'Oklahoma', code: 'OK', population: 4053824, land_area: 68595, density: 59.1 },
            { name: 'Oregon', code: 'OR', population: 4233358, land_area: 95988, density: 44.1 },
            { name: 'Pennsylvania', code: 'PA', population: 12961683, land_area: 44743, density: 289.7 },
            { name: 'Rhode Island', code: 'RI', population: 1095962, land_area: 1034, density: 1060.0 },
            { name: 'South Carolina', code: 'SC', population: 5373555, land_area: 30061, density: 178.7 },
            { name: 'South Dakota', code: 'SD', population: 919318, land_area: 75811, density: 12.1 },
            { name: 'Tennessee', code: 'TN', population: 7126489, land_area: 41235, density: 172.8 },
            { name: 'Texas', code: 'TX', population: 30503301, land_area: 261232, density: 116.8 },
            { name: 'Utah', code: 'UT', population: 3417734, land_area: 82170, density: 41.6 },
            { name: 'Vermont', code: 'VT', population: 647464, land_area: 9217, density: 70.3 },
            { name: 'Virginia', code: 'VA', population: 8715698, land_area: 39490, density: 220.7 },
            { name: 'Washington', code: 'WA', population: 7812880, land_area: 66455, density: 117.6 },
            { name: 'West Virginia', code: 'WV', population: 1770071, land_area: 24038, density: 73.6 },
            { name: 'Wisconsin', code: 'WI', population: 5910109, land_area: 54158, density: 109.1 },
            { name: 'Wyoming', code: 'WY', population: 584057, land_area: 97093, density: 6.0 },
            { name: 'Washington D.C.', code: 'DC', population: 678972, land_area: 158, density: 11280.7 }
        ],
        postcodeRegex: /^\d{5}(-\d{4})?$/,
        postcodeFormat: "99999"
    },
    GB: {
        name: 'United Kingdom',
        regions: [
            // England Counties
            { name: 'Bedfordshire', code: 'BDF' }, { name: 'Berkshire', code: 'BRK' }, { name: 'Bristol', code: 'BST' },
            { name: 'Buckinghamshire', code: 'BKM' }, { name: 'Cambridgeshire', code: 'CAM' }, { name: 'Cheshire', code: 'CHS' },
            { name: 'Cornwall', code: 'CON' }, { name: 'County Durham', code: 'DUR' }, { name: 'Cumbria', code: 'CMA' },
            { name: 'Derbyshire', code: 'DBY' }, { name: 'Devon', code: 'DEV' }, { name: 'Dorset', code: 'DOR' },
            { name: 'East Riding of Yorkshire', code: 'ERY' }, { name: 'East Sussex', code: 'ESX' }, { name: 'Essex', code: 'ESS' },
            { name: 'Gloucestershire', code: 'GLS' }, { name: 'Greater London', code: 'LND' }, { name: 'Greater Manchester', code: 'GMN' },
            { name: 'Hampshire', code: 'HAM' }, { name: 'Herefordshire', code: 'HEF' }, { name: 'Hertfordshire', code: 'HRT' },
            { name: 'Isle of Wight', code: 'IOW' }, { name: 'Kent', code: 'KEN' }, { name: 'Lancashire', code: 'LAN' },
            { name: 'Leicestershire', code: 'LEI' }, { name: 'Lincolnshire', code: 'LIN' }, { name: 'Merseyside', code: 'MSY' },
            { name: 'Norfolk', code: 'NFK' }, { name: 'North Yorkshire', code: 'NYK' }, { name: 'Northamptonshire', code: 'NTH' },
            { name: 'Northumberland', code: 'NBL' }, { name: 'Nottinghamshire', code: 'NTT' }, { name: 'Oxfordshire', code: 'OXF' },
            { name: 'Rutland', code: 'RUT' }, { name: 'Shropshire', code: 'SHR' }, { name: 'Somerset', code: 'SOM' },
            { name: 'South Yorkshire', code: 'SYK' }, { name: 'Staffordshire', code: 'STS' }, { name: 'Suffolk', code: 'SFK' },
            { name: 'Surrey', code: 'SRY' }, { name: 'Tyne and Wear', code: 'TWR' }, { name: 'Warwickshire', code: 'WAR' },
            { name: 'West Midlands', code: 'WMD' }, { name: 'West Sussex', code: 'WSX' }, { name: 'West Yorkshire', code: 'WYK' },
            { name: 'Wiltshire', code: 'WIL' }, { name: 'Worcestershire', code: 'WOR' },
            // Nations
            { name: 'Scotland', code: 'SCT' }, { name: 'Wales', code: 'WLS' }, { name: 'Northern Ireland', code: 'NIR' }
        ],
        postcodeRegex: /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i,
        postcodeFormat: "SW1A 1AA"
    },
    CA: {
        name: 'Canada',
        regions: [
            { name: 'Alberta', code: 'AB' }, { name: 'British Columbia', code: 'BC' },
            { name: 'Manitoba', code: 'MB' }, { name: 'New Brunswick', code: 'NB' },
            { name: 'Newfoundland and Labrador', code: 'NL' }, { name: 'Nova Scotia', code: 'NS' },
            { name: 'Ontario', code: 'ON' }, { name: 'Prince Edward Island', code: 'PE' },
            { name: 'Quebec', code: 'QC' }, { name: 'Saskatchewan', code: 'SK' },
            { name: 'Northwest Territories', code: 'NT' }, { name: 'Nunavut', code: 'NU' },
            { name: 'Yukon', code: 'YT' }
        ],
        postcodeRegex: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
        postcodeFormat: "A1A 1A1"
    },
    AU: {
        name: 'Australia',
        regions: [
            { name: 'New South Wales', code: 'NSW' }, { name: 'Victoria', code: 'VIC' },
            { name: 'Queensland', code: 'QLD' }, { name: 'Western Australia', code: 'WA' },
            { name: 'South Australia', code: 'SA' }, { name: 'Tasmania', code: 'TAS' },
            { name: 'Australian Capital Territory', code: 'ACT' }, { name: 'Northern Territory', code: 'NT' }
        ],
        postcodeRegex: /^\d{4}$/,
        postcodeFormat: "2000"
    },
    CN: {
        name: 'China',
        regions: [
            { name: 'Beijing', code: 'BJ' }, { name: 'Shanghai', code: 'SH' }, { name: 'Tianjin', code: 'TJ' },
            { name: 'Chongqing', code: 'CQ' }, { name: 'Guangdong', code: 'GD' }, { name: 'Jiangsu', code: 'JS' },
            { name: 'Zhejiang', code: 'ZJ' }, { name: 'Fujian', code: 'FJ' }, { name: 'Shandong', code: 'SD' },
            { name: 'Hubei', code: 'HB' }, { name: 'Hunan', code: 'HN' }, { name: 'Sichuan', code: 'SC' },
            { name: 'Anhui', code: 'AH' }, { name: 'Gansu', code: 'GS' }, { name: 'Guizhou', code: 'GZ' },
            { name: 'Hainan', code: 'HI' }, { name: 'Hebei', code: 'HE' }, { name: 'Heilongjiang', code: 'HL' },
            { name: 'Henan', code: 'HA' }, { name: 'Jiangxi', code: 'JX' }, { name: 'Jilin', code: 'JL' },
            { name: 'Liaoning', code: 'LN' }, { name: 'Qinghai', code: 'QH' }, { name: 'Shaanxi', code: 'SN' },
            { name: 'Shanxi', code: 'SX' }, { name: 'Yunnan', code: 'YN' }, { name: 'Inner Mongolia', code: 'IM' },
            { name: 'Guangxi', code: 'GX' }, { name: 'Ningxia', code: 'NX' }, { name: 'Tibet', code: 'TB' },
            { name: 'Xinjiang', code: 'XJ' }, { name: 'Hong Kong', code: 'HK' }, { name: 'Macau', code: 'MO' }
        ],
        postcodeRegex: /^\d{6}$/,
        postcodeFormat: "100000"
    },
    JP: {
        name: 'Japan',
        regions: [
            { name: 'Hokkaido', code: '01' }, { name: 'Aomori', code: '02' }, { name: 'Iwate', code: '03' },
            { name: 'Miyagi', code: '04' }, { name: 'Akita', code: '05' }, { name: 'Yamagata', code: '06' },
            { name: 'Fukushima', code: '07' }, { name: 'Ibaraki', code: '08' }, { name: 'Tochigi', code: '09' },
            { name: 'Gunma', code: '10' }, { name: 'Saitama', code: '11' }, { name: 'Chiba', code: '12' },
            { name: 'Tokyo', code: '13' }, { name: 'Kanagawa', code: '14' }, { name: 'Niigata', code: '15' },
            { name: 'Toyama', code: '16' }, { name: 'Ishikawa', code: '17' }, { name: 'Fukui', code: '18' },
            { name: 'Yamanashi', code: '19' }, { name: 'Nagano', code: '20' }, { name: 'Gifu', code: '21' },
            { name: 'Shizuoka', code: '22' }, { name: 'Aichi', code: '23' }, { name: 'Mie', code: '24' },
            { name: 'Shiga', code: '25' }, { name: 'Kyoto', code: '26' }, { name: 'Osaka', code: '27' },
            { name: 'Hyogo', code: '28' }, { name: 'Nara', code: '29' }, { name: 'Wakayama', code: '30' },
            { name: 'Tottori', code: '31' }, { name: 'Shimane', code: '32' }, { name: 'Okayama', code: '33' },
            { name: 'Hiroshima', code: '34' }, { name: 'Yamaguchi', code: '35' }, { name: 'Tokushima', code: '36' },
            { name: 'Kagawa', code: '37' }, { name: 'Ehime', code: '38' }, { name: 'Kochi', code: '39' },
            { name: 'Fukuoka', code: '40' }, { name: 'Saga', code: '41' }, { name: 'Nagasaki', code: '42' },
            { name: 'Kumamoto', code: '43' }, { name: 'Oita', code: '44' }, { name: 'Miyazaki', code: '45' },
            { name: 'Kagoshima', code: '46' }, { name: 'Okinawa', code: '47' }
        ],
        postcodeRegex: /^\d{3}-?\d{4}$/,
        postcodeFormat: "100-0001"
    },
    DE: {
        name: 'Germany',
        regions: [
            { name: 'Baden-Württemberg', code: 'BW' }, { name: 'Bavaria', code: 'BY' },
            { name: 'Berlin', code: 'BE' }, { name: 'Brandenburg', code: 'BB' },
            { name: 'Bremen', code: 'HB' }, { name: 'Hamburg', code: 'HH' },
            { name: 'Hesse', code: 'HE' }, { name: 'Lower Saxony', code: 'NI' },
            { name: 'Mecklenburg-Vorpommern', code: 'MV' }, { name: 'North Rhine-Westphalia', code: 'NW' },
            { name: 'Rhineland-Palatinate', code: 'RP' }, { name: 'Saarland', code: 'SL' },
            { name: 'Saxony', code: 'SN' }, { name: 'Saxony-Anhalt', code: 'ST' },
            { name: 'Schleswig-Holstein', code: 'SH' }, { name: 'Thuringia', code: 'TH' }
        ],
        postcodeRegex: /^\d{5}$/,
        postcodeFormat: "10115"
    },
    FR: {
        name: 'France',
        regions: [
            { name: 'Auvergne-Rhône-Alpes', code: 'ARA' }, { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
            { name: 'Brittany', code: 'BRE' }, { name: 'Centre-Val de Loire', code: 'CVL' },
            { name: 'Corsica', code: 'COR' }, { name: 'Grand Est', code: 'GES' },
            { name: 'Hauts-de-France', code: 'HDF' }, { name: 'Île-de-France', code: 'IDF' },
            { name: 'Normandy', code: 'NOR' }, { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
            { name: 'Occitanie', code: 'OCC' }, { name: 'Pays de la Loire', code: 'PDL' },
            { name: 'Provence-Alpes-Côte d\'Azur', code: 'PAC' }
        ],
        postcodeRegex: /^\d{5}$/,
        postcodeFormat: "75001"
    },
    ES: {
        name: 'Spain',
        regions: [
            { name: 'Andalusia', code: 'AN' }, { name: 'Aragon', code: 'AR' },
            { name: 'Asturias', code: 'AS' }, { name: 'Balearic Islands', code: 'IB' },
            { name: 'Basque Country', code: 'PV' }, { name: 'Canary Islands', code: 'CN' },
            { name: 'Cantabria', code: 'CB' }, { name: 'Castile and León', code: 'CL' },
            { name: 'Castile-La Mancha', code: 'CM' }, { name: 'Catalonia', code: 'CT' },
            { name: 'Extremadura', code: 'EX' }, { name: 'Galicia', code: 'GA' },
            { name: 'La Rioja', code: 'RI' }, { name: 'Madrid', code: 'MD' },
            { name: 'Murcia', code: 'MC' }, { name: 'Navarre', code: 'NC' },
            { name: 'Valencia', code: 'VC' }
        ],
        postcodeRegex: /^\d{5}$/,
        postcodeFormat: "28001"
    },
    IT: {
        name: 'Italy',
        regions: [
            { name: 'Abruzzo', code: 'ABR' }, { name: 'Aosta Valley', code: 'VAO' },
            { name: 'Apulia', code: 'PUG' }, { name: 'Basilicata', code: 'BAS' },
            { name: 'Calabria', code: 'CAL' }, { name: 'Campania', code: 'CAM' },
            { name: 'Emilia-Romagna', code: 'EMR' }, { name: 'Friuli-Venezia Giulia', code: 'FVG' },
            { name: 'Lazio', code: 'LAZ' }, { name: 'Liguria', code: 'LIG' },
            { name: 'Lombardy', code: 'LOM' }, { name: 'Marche', code: 'MAR' },
            { name: 'Molise', code: 'MOL' }, { name: 'Piedmont', code: 'PIE' },
            { name: 'Sardinia', code: 'SAR' }, { name: 'Sicily', code: 'SIC' },
            { name: 'Tuscany', code: 'TOS' }, { name: 'Trentino-South Tyrol', code: 'TAA' },
            { name: 'Umbria', code: 'UMB' }, { name: 'Veneto', code: 'VEN' }
        ],
        postcodeRegex: /^\d{5}$/,
        postcodeFormat: "00100"
    },
    IN: {
        name: 'India',
        regions: [
            { name: 'Andhra Pradesh', code: 'AP' }, { name: 'Arunachal Pradesh', code: 'AR' },
            { name: 'Assam', code: 'AS' }, { name: 'Bihar', code: 'BR' },
            { name: 'Chhattisgarh', code: 'CG' }, { name: 'Goa', code: 'GA' },
            { name: 'Gujarat', code: 'GJ' }, { name: 'Haryana', code: 'HR' },
            { name: 'Himachal Pradesh', code: 'HP' }, { name: 'Jharkhand', code: 'JK' },
            { name: 'Karnataka', code: 'KA' }, { name: 'Kerala', code: 'KL' },
            { name: 'Madhya Pradesh', code: 'MP' }, { name: 'Maharashtra', code: 'MH' },
            { name: 'Manipur', code: 'MN' }, { name: 'Meghalaya', code: 'ML' },
            { name: 'Mizoram', code: 'MZ' }, { name: 'Nagaland', code: 'NL' },
            { name: 'Odisha', code: 'OR' }, { name: 'Punjab', code: 'PB' },
            { name: 'Rajasthan', code: 'RJ' }, { name: 'Sikkim', code: 'SK' },
            { name: 'Tamil Nadu', code: 'TN' }, { name: 'Telangana', code: 'TG' },
            { name: 'Tripura', code: 'TR' }, { name: 'Uttar Pradesh', code: 'UP' },
            { name: 'Uttarakhand', code: 'UK' }, { name: 'West Bengal', code: 'WB' },
            { name: 'Delhi', code: 'DL' }
        ],
        postcodeRegex: /^\d{6}$/,
        postcodeFormat: "110001"
    },
    ID: {
        name: 'Indonesia',
        regions: [
            { name: 'Jakarta', code: 'JK' }, { name: 'West Java', code: 'JB' },
            { name: 'Central Java', code: 'JT' }, { name: 'East Java', code: 'JI' },
            { name: 'Banten', code: 'BT' }, { name: 'Special Region of Yogyakarta', code: 'YO' },
            { name: 'Bali', code: 'BA' }, { name: 'North Sumatra', code: 'SU' },
            { name: 'South Sulawesi', code: 'SN' }, { name: 'West Kalimantan', code: 'KB' }
        ],
        postcodeRegex: /^\d{5}$/,
        postcodeFormat: "10110"
    },
    TH: {
        name: 'Thailand',
        regions: [
            { name: 'Bangkok', code: 'BKK' }, { name: 'Nonthaburi', code: 'NON' },
            { name: 'Samut Prakan', code: 'SAM' }, { name: 'Pathum Thani', code: 'PAT' },
            { name: 'Chon Buri', code: 'CHO' }, { name: 'Chiang Mai', code: 'CHI' },
            { name: 'Nakhon Ratchasima', code: 'NAK' }, { name: 'Phuket', code: 'PHU' },
            { name: 'Songkhla', code: 'SON' }, { name: 'Surat Thani', code: 'SUR' }
        ],
        postcodeRegex: /^\d{5}$/,
        postcodeFormat: "10100"
    },
    VN: {
        name: 'Vietnam',
        regions: [
            { name: 'Ho Chi Minh City', code: 'SG' }, { name: 'Hanoi', code: 'HN' },
            { name: 'Da Nang', code: 'DN' }, { name: 'Hai Phong', code: 'HP' },
            { name: 'Can Tho', code: 'CT' }, { name: 'Binh Duong', code: 'BD' },
            { name: 'Dong Nai', code: 'DN' }, { name: 'Long An', code: 'LA' },
            { name: 'Quang Ninh', code: 'QN' }, { name: 'Khanh Hoa', code: 'KH' }
        ],
        postcodeRegex: /^\d{6}$/,
        postcodeFormat: "700000"
    },
    PH: {
        name: 'Philippines',
        regions: [
            { name: 'National Capital Region', code: 'NCR' }, { name: 'CALABARZON', code: '4A' },
            { name: 'Central Luzon', code: '3' }, { name: 'Central Visayas', code: '7' },
            { name: 'Western Visayas', code: '6' }, { name: 'Davao Region', code: '11' },
            { name: 'Northern Mindanao', code: '10' }, { name: 'Ilocos Region', code: '1' },
            { name: 'Bicol Region', code: '5' }, { name: 'Zamboanga Peninsula', code: '9' }
        ],
        postcodeRegex: /^\d{4}$/,
        postcodeFormat: "1000"
    },

};

export const getGeoConfig = (countryCode) => {
    return GEO_DATA[countryCode] || GEO_DATA['US'];
};
