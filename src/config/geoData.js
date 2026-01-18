/**
 * Structured Geographic Data for Supported Countries
 * Includes: States/Provinces/Regions and Postcode Validation Regex
 * Data sourced from standard international administrative divisions.
 */

export const GEO_DATA = {
    US: {
        name: 'United States',
        regions: [
            { name: 'Alabama', code: 'AL' }, { name: 'Alaska', code: 'AK' }, { name: 'Arizona', code: 'AZ' },
            { name: 'Arkansas', code: 'AR' }, { name: 'California', code: 'CA' }, { name: 'Colorado', code: 'CO' },
            { name: 'Connecticut', code: 'CT' }, { name: 'Delaware', code: 'DE' }, { name: 'Florida', code: 'FL' },
            { name: 'Georgia', code: 'GA' }, { name: 'Hawaii', code: 'HI' }, { name: 'Idaho', code: 'ID' },
            { name: 'Illinois', code: 'IL' }, { name: 'Indiana', code: 'IN' }, { name: 'Iowa', code: 'IA' },
            { name: 'Kansas', code: 'KS' }, { name: 'Kentucky', code: 'KY' }, { name: 'Louisiana', code: 'LA' },
            { name: 'Maine', code: 'ME' }, { name: 'Maryland', code: 'MD' }, { name: 'Massachusetts', code: 'MA' },
            { name: 'Michigan', code: 'MI' }, { name: 'Minnesota', code: 'MN' }, { name: 'Mississippi', code: 'MS' },
            { name: 'Missouri', code: 'MO' }, { name: 'Montana', code: 'MT' }, { name: 'Nebraska', code: 'NE' },
            { name: 'Nevada', code: 'NV' }, { name: 'New Hampshire', code: 'NH' }, { name: 'New Jersey', code: 'NJ' },
            { name: 'New Mexico', code: 'NM' }, { name: 'New York', code: 'NY' }, { name: 'North Carolina', code: 'NC' },
            { name: 'North Dakota', code: 'ND' }, { name: 'Ohio', code: 'OH' }, { name: 'Oklahoma', code: 'OK' },
            { name: 'Oregon', code: 'OR' }, { name: 'Pennsylvania', code: 'PA' }, { name: 'Rhode Island', code: 'RI' },
            { name: 'South Carolina', code: 'SC' }, { name: 'South Dakota', code: 'SD' }, { name: 'Tennessee', code: 'TN' },
            { name: 'Texas', code: 'TX' }, { name: 'Utah', code: 'UT' }, { name: 'Vermont', code: 'VT' },
            { name: 'Virginia', code: 'VA' }, { name: 'Washington', code: 'WA' }, { name: 'West Virginia', code: 'WV' },
            { name: 'Wisconsin', code: 'WI' }, { name: 'Wyoming', code: 'WY' }
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
    }
};

export const getGeoConfig = (countryCode) => {
    return GEO_DATA[countryCode] || GEO_DATA['US'];
};
