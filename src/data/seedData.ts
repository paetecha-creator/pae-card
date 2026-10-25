import { CreditCard, Transaction, TransactionType } from '../types';

export const INITIAL_CARDS: CreditCard[] = [];

export const RAW_CSV_DATA = `วันที่รายการ,ชื่อบัตรหรือช่องทางชำระ,สถานะการชำระ,รายการ/ร้านค้า, จำนวนเงิน ,หมายเหตุ
2026-10-10,KTC,ซื้อ,Youtube premium,  399.00 ,
2026-10-10,KTC,ซื้อ,ตู้พระ,  354.20 ,
2026-10-10,KTC,ซื้อ,ดีแทค,  128.40 ,
2026-10-10,KTC,ซื้อ,สายโรล,  672.33 ,shopee
2026-11-10,KTC,ซื้อ,สายโรล,  672.33 ,shopee
2026-10-10,KTC,ซื้อ,AIR TCL,  921.60 ,shopee
2026-11-10,KTC,ซื้อ,AIR TCL,  921.60 ,shopee
2026-09-10,Lotus,ซื้อ,บางจาก,"  1,000.00 ",
2026-09-10,Lotus,ซื้อ,บางจาก,"  1,000.00 ",
2026-09-10,Lotus,ซื้อ,ทรู,  853.86 ,
2026-09-10,Lotus,ซื้อ,ทรูู,  969.96 ,
2026-09-10,Lotus,ซื้อ,เยลลี่พริกเกลือ,  168.00 ,
2026-09-10,Lotus,ซื้อ,เคส18PM,  199.99 ,
2026-09-10,Lotus,ซื้อ,AIS,  944.93 ,
2026-09-10,Lotus,ซื้อ,3BB,  535.00 ,
2026-09-10,Lotus,ซื้อ,Dohome,  538.00 ,
2026-09-10,Lotus,ซื้อ,แผ่นไฟเบอร์ใส,  577.00 ,
2026-09-10,Lotus,ซื้อ,ถังคอนโดแมว,  241.00 ,
2026-09-10,Lotus,ซื้อ,เคส13pro,  157.00 ,
2026-09-10,Lotus,ซื้อ,หัวตะเกียง,  164.00 ,
2026-09-10,Lotus,ซื้อ,ท่อเครื่องดูดฝุ่น,  377.00 ,
2026-09-10,Lotus,ซื้อ,เคสกระจก,  306.00 ,
2026-09-10,Lotus,ซื้อ,หม่าล่า,  382.20 ,
2026-09-10,Lotus,ซื้อ,คานิวาเม็ด,"  1,092.00 ",
2026-09-10,Lotus,ซื้อ,TCL Air ห้องพระ,  796.20 ,8/10
2026-10-10,Lotus,ซื้อ,เยลลี่พริกเกลือ,169.62,
2026-10-10,Lotus,ซื้อ,เปียกแมว2ลัง,"1,379.00",
2026-10-10,Lotus,ซื้อ,อกไก่ฟรีซดราย,336,
2026-10-10,Lotus,ซื้อ,สมาร์ทปลั๊กรูกลม,144,
2026-10-10,Lotus,ซื้อ,สมาร์์ทปลัก+รีโมท,  237.00 ,
2026-10-10,Lotus,ซื้อ,สติกเกอร์เม้าส์,160,
2026-10-10,Lotus,ซื้อ,TCL Air ห้องพระ,796.2,9/10
2026-11-10,Lotus,ซื้อ,TCL Air ห้องพระ,796.2,10/10
2026-09-10,Lotus,เงินคืน,บางจาก,  42.00 ,
2026-09-10,Homepro,ซื้อ,เครื่องซักผ้า,"  1,667.20 ",5/10
2026-10-11,Homepro,ซื้อ,เครื่องซักผ้า,"  1,667.20 ",6/10
2026-11-12,Homepro,ซื้อ,เครื่องซักผ้า,"  1,667.20 ",7/10
2026-12-13,Homepro,ซื้อ,เครื่องซักผ้า,"  1,667.20 ",8/10
2027-01-14,Homepro,ซื้อ,เครื่องซักผ้า,"  1,667.20 ",9/10
2027-02-15,Homepro,ซื้อ,เครื่องซักผ้า,"  1,667.20 ",10/10
2026-09-13,TTB,ซื้อ,แว่นตา,416.31,3/3
2026-09-13,TTB,ซื้อ,โต๊ะรีดผ้า,  394.00 ,3/3
2026-09-13,TTB,ซื้อ,ค่าไฟ,"  1,705.10 ",
2026-09-13,TTB,ซื้อ,ISUZU,"1,050.83",ซ่อมบำรุง
2026-10-13,TTB,ซื้อ,ISUZU,"1,050.83",ซ่อมบำรุง
2026-11-13,TTB,ซื้อ,ISUZU,"1,050.83",ซ่อมบำรุง
2026-09-13,TTB,ซื้อ,UAG Monarch Pro Case iPhone 16 Pro Max Kevlar Mallard,751.67,3/3
2026-09-13,TTB,ซื้อ,UAG Case ,863.34,3/3
2026-10-11,Shopee,ซื้อ,กลอนดิจิตอล,  121.00 ,3/5
2026-11-13,Shopee,ซื้อ,กลอนดิจิตอล,  121.00 ,4/5
2026-12-13,Shopee,ซื้อ,กลอนดิจิตอล,  121.00 ,5/5
2026-10-11,Shopee,ซื้อ,Mini PC,899,4/5
2026-11-13,Shopee,ซื้อ,Mini PC,899,5/5
2026-10-11,Shopee,ซื้อ,Logitech MX master4,839.67,1/3
2026-11-13,Shopee,ซื้อ,Logitech MX master4,839.67,2/3
2026-12-13,Shopee,ซื้อ,Logitech MX master4,839.67,3/3
2026-10-11,Shopee,ซื้อ,เครื่องชงกาแฟ,  178.33 ,2/3
2026-11-13,Shopee,ซื้อ,เครื่องชงกาแฟ,  178.33 ,3/3
2026-10-11,Shopee,ซื้อ,ยูเซอรีน,  308.23 ,3/5
2026-11-13,Shopee,ซื้อ,ยูเซอรีน,  308.23 ,4/5
2026-12-13,Shopee,ซื้อ,ยูเซอรีน,  308.23 ,5/5
2026-10-11,Shopee,ซื้อ,Harman gardon enchant,1269.6,
2026-10-11,Shopee,ซื้อ,Harman gardon enchant,1185.2,
2026-10-11,KTC,ซื้อ,Youtube premium,399.00,
2026-11-11,KTC,ซื้อ,Youtube premium,399.00,
2026-12-11,KTC,ซื้อ,Youtube premium,399.00,
2027-01-11,KTC,ซื้อ,Youtube premium,399.00,
2027-02-11,KTC,ซื้อ,Youtube premium,399.00,
2027-03-11,KTC,ซื้อ,Youtube premium,399.00,
2027-04-11,KTC,ซื้อ,Youtube premium,399.00,
2027-05-11,KTC,ซื้อ,Youtube premium,399.00,
2027-06-11,KTC,ซื้อ,Youtube premium,399.00,
2027-07-11,KTC,ซื้อ,Youtube premium,399.00,
2027-08-11,KTC,ซื้อ,Youtube premium,399.00,
2027-09-11,KTC,ซื้อ,Youtube premium,399.00,
2027-10-11,KTC,ซื้อ,Youtube premium,399.00,
2027-11-11,KTC,ซื้อ,Youtube premium,399.00,
2027-12-11,KTC,ซื้อ,Youtube premium,399.00,
2028-01-11,KTC,ซื้อ,Youtube premium,399.00,
2028-02-11,KTC,ซื้อ,Youtube premium,399.00,
2028-03-11,KTC,ซื้อ,Youtube premium,399.00,
2028-04-11,KTC,ซื้อ,Youtube premium,399.00,
2028-05-11,KTC,ซื้อ,Youtube premium,399.00,
2028-06-11,KTC,ซื้อ,Youtube premium,399.00,
2028-07-11,KTC,ซื้อ,Youtube premium,399.00,
2028-08-11,KTC,ซื้อ,Youtube premium,399.00,
2028-09-11,KTC,ซื้อ,Youtube premium,399.00,
2026-10-11,TTB,ซื้อ,เมาส์พี่อุ๊ 125 จอจิ๋ว 224,348.34,(ผ่อน 1/3)
2026-11-11,TTB,ซื้อ,เมาส์พี่อุ๊ 125 จอจิ๋ว 224,348.34,(ผ่อน 2/3)
2026-12-11,TTB,ซื้อ,เมาส์พี่อุ๊ 125 จอจิ๋ว 224,348.34,(ผ่อน 3/3)
2026-10-12,Lotus,ซื้อ,เมล็ดกาแฟดอยช้าง,532.00,Shopee
2026-10-12,TTB,เงินคืน,จอมินิ,671.00,ยกเลิก shopee
2026-10-12,Lotus,ซื้อ,เยลลี่โคล่า,152.10,Tiktok
2026-10-12,TTB,ซื้อ,ราวตากผ้า,459.35,Tiktok (ผ่อน 1/3)
2026-11-12,TTB,ซื้อ,ราวตากผ้า,459.35,Tiktok (ผ่อน 2/3)
2026-12-12,TTB,ซื้อ,ราวตากผ้า,459.35,Tiktok (ผ่อน 3/3)
2026-10-13,Lotus,ซื้อ,3BB,535.00,
2026-10-14,Lotus,ซื้อ,เติมน้ำมัน,"1,000.00",บางจาก
2026-10-14,Lotus,เงินคืน,เติมน้ำมัน,21.00,บางจาก
2026-10-16,KTC,ซื้อ,สุกี้โบนัส,276.38,
2026-10-17,Lotus,ซื้อ,เตินน้ำมันแจ๊ส,900.00,บางจาก
2026-10-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 1/10)
2026-11-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 2/10)
2026-12-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 3/10)
2027-01-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 4/10)
2027-02-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 5/10)
2027-03-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 6/10)
2027-04-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 7/10)
2027-05-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 8/10)
2027-06-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 9/10)
2027-07-17,Homepro,ซื้อ,ออโรร่า,"6,944.00",ทองแท่ง (ผ่อน 10/10)
2026-10-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 1/10)
2026-11-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 2/10)
2026-12-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 3/10)
2027-01-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 4/10)
2027-02-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 5/10)
2027-03-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 6/10)
2027-04-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 7/10)
2027-05-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 8/10)
2027-06-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 9/10)
2027-07-17,SCB,ซื้อ,ออโรร่า,"3,484.00",สร้อยข้อมือ (ผ่อน 10/10)
2026-10-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 1/10)
2026-11-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 2/10)
2026-12-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 3/10)
2027-01-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 4/10)
2027-02-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 5/10)
2027-03-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 6/10)
2027-04-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 7/10)
2027-05-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 8/10)
2027-06-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 9/10)
2027-07-17,KTC,ซื้อ,Vivo,579.90,(ผ่อน 10/10)
2026-10-17,KTC,ซื้อ,Bonchon,590.64,
2026-10-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 1/10)
2026-11-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 2/10)
2026-12-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 3/10)
2027-01-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 4/10)
2027-02-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 5/10)
2027-03-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 6/10)
2027-04-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 7/10)
2027-05-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 8/10)
2027-06-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 9/10)
2027-07-17,Lotus,ซื้อ,ประกันรถยนต์,"1,200.00",Honda Jazz (ผ่อน 10/10)
2027-10-07,Lotus,ซื้อ,Lotus Express,796.20,
2027-10-02,Lotus,เงินคืน,Lotus Rewards,847.00,
2027-10-01,Lotus,ซื้อ,Lotus Superstore,847.00,
2027-09-28,Lotus,ซื้อ,ของใช้ในบ้าน,426.93,
2027-09-28,Lotus,ซื้อ,ทรู,969.96,
2027-09-27,Lotus,ซื้อ,ของสด,328.20,
2027-09-25,Lotus,ซื้อ,อาหารสัตว์,"1,092.00",
2027-09-21,Lotus,เงินคืน,Cashback,21.00,
2027-09-21,Lotus,ซื้อ,เบเกอรี่,251.71,
2027-09-21,Lotus,ซื้อ,อุปกรณ์ไอที,199.99,
2027-09-21,Lotus,เงินคืน,โปรโมชั่น,125.62,
2027-09-21,Lotus,เงินคืน,โปรโมชั่น,126.09,
2027-09-21,Lotus,เงินคืน,คืนเงินshopee,462.00,
2027-09-21,Lotus,เงินคืน,คืนเงินบัตร,413.00,
2027-09-21,Lotus,ซื้อ,ของใช้ส่วนตัว,306.00,
2027-09-20,Lotus,เงินคืน,บางจาก,21.00,
2027-09-20,Lotus,ซื้อ,AIS รายเดือน,944.93,
2027-09-20,Lotus,ซื้อ,เติมน้ำมันบางจาก,"1,000.00",
2027-09-20,Lotus,ซื้อ,ซุปเปอร์มาร์เก็ต,875.00,
2027-09-20,Lotus,ซื้อ,อุปกรณ์ช่าง,164.00,
2027-09-20,Lotus,ซื้อ,เครื่องใช้ไฟฟ้า,377.00,
2027-09-19,Lotus,ซื้อ,เติมน้ำมันบางจาก,"1,000.00",
2027-09-15,Lotus,ซื้อ,อาหารแห้ง,167.00,
2027-09-15,Lotus,ซื้อ,เครื่องปรุง,713.00,
2027-09-14,Lotus,ซื้อ,ขนมขบเคี้ยว,157.00,
2027-09-14,Lotus,ซื้อ,น้ำดื่ม,268.00,
2027-09-12,Lotus,ซื้อ,3BB อินเทอร์เน็ต,535.00,
2027-09-12,Lotus,ซื้อ,ของกินเล่น,168.00,
2027-09-10,Lotus,เงินคืน,บางจาก Cash,21.00,
2027-09-09,Lotus,ซื้อ,เติมน้ำมันบางจาก,"1,000.00",
2027-09-09,Lotus,ซื้อ,วัสดุก่อสร้าง,577.00,
2027-09-09,Lotus,ซื้อ,ของเล่นสัตว์เลี้ยง,241.00,
2027-09-08,Lotus,ซื้อ,ของใช้ในครัว,426.93,
2027-09-07,Lotus,ซื้อ,Dohome ของใช้,538.00,
2026-08-10,Homepro,ซื้อ,เครื่องซักผ้า,"  1,667.20 ",4/10
2026-10-22,Homepro,จ่ายบิล,ชำระยอดบิลบัตรเครดิต,"1,667.20",รอบชำระต.ค. 2026`;

/**
 * Intelligent categorization helper based on item title and notes
 */
export function inferCategory(title: string, note: string, type: TransactionType): string {
  if (type === 'จ่ายบิล') return 'ชำระบิลบัตร';
  if (type === 'เงินคืน') return 'เงินคืน/Cashback';

  const text = `${title} ${note}`.toLowerCase();

  if (text.includes('น้ำมัน') || text.includes('บางจาก') || text.includes('jazz') || text.includes('isuzu') || text.includes('ซ่อมบำรุง')) {
    return 'ยานยนต์และน้ำมัน';
  }
  if (text.includes('ค่าไฟ') || text.includes('3bb') || text.includes('ais') || text.includes('ทรู') || text.includes('ดีแทค') || text.includes('เน็ต')) {
    return 'สาธารณูปโภค & สื่อสาร';
  }
  if (text.includes('youtube') || text.includes('premium') || text.includes('netflix') || text.includes('spotify') || text.includes('enchant') || text.includes('harman')) {
    return 'ความบันเทิง & บริการดิจิทัล';
  }
  if (text.includes('เครื่องซักผ้า') || text.includes('air') || text.includes('แอร์') || text.includes('เครื่องดูดฝุ่น') || text.includes('เครื่องชงกาแฟ') || text.includes('mini pc') || text.includes('ตู้พระ') || text.includes('ปลั๊ก') || text.includes('dohome') || text.includes('โต๊ะรีด') || text.includes('ราวตาก')) {
    return 'เครื่องใช้ไฟฟ้า & ของแต่งบ้าน';
  }
  if (text.includes('แมว') || text.includes('คานิวา') || text.includes('อกไก่') || text.includes('สัตว์')) {
    return 'สัตว์เลี้ยงแสนรัก';
  }
  if (text.includes('สุกี้') || text.includes('bonchon') || text.includes('หม่าล่า') || text.includes('กาแฟ') || text.includes('เยลลี่') || text.includes('อาหาร') || text.includes('เบเกอรี่')) {
    return 'อาหารและเครื่องดื่ม';
  }
  if (text.includes('ทองแท่ง') || text.includes('ออโรร่า') || text.includes('สร้อยข้อมือ')) {
    return 'ทองคำ & ทรัพย์สิน';
  }
  if (text.includes('ประกัน')) {
    return 'ประกันภัย';
  }
  if (text.includes('ยูเซอรีน') || text.includes('แว่นตา')) {
    return 'สุขภาพ & สกินแคร์';
  }
  if (text.includes('เคส') || text.includes('uag') || text.includes('vivo') || text.includes('เมาส์') || text.includes('logitech') || text.includes('กลอนดิจิตอล') || text.includes('สายโรล') || text.includes('shopee') || text.includes('tiktok')) {
    return 'ไอที & อุปกรณ์เสริม';
  }

  return 'ช้อปปิ้งทั่วไป';
}

/**
 * Extracts installment details like "8/10", "(ผ่อน 1/3)", "ทองแท่ง (ผ่อน 1/10)"
 */
export function extractInstallmentMeta(note: string, title: string): { current: number; total: number; planName?: string } | undefined {
  const combined = `${note} ${title}`;
  // matches e.g. 8/10 or 1/3 or ผ่อน 1/10
  const match = combined.match(/(?:ผ่อน\s*)?(\d+)\s*\/\s*(\d+)/i);
  if (match) {
    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (!isNaN(current) && !isNaN(total) && total >= 2) {
      return {
        current,
        total,
        planName: title.trim() || 'ผ่อนชำระ',
      };
    }
  }
  return undefined;
}

/**
 * Parses raw CSV line into structured Transaction
 */
export function parseCSVData(csv: string): Transaction[] {
  const lines = csv.split('\n').filter((l) => l.trim().length > 0);
  const result: Transaction[] = [];

  // Line 0 is header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with commas inside quotes e.g. "  1,000.00 "
    const tokens: string[] = [];
    let insideQuotes = false;
    let currentToken = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        tokens.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    tokens.push(currentToken.trim());

    if (tokens.length >= 5) {
      const date = tokens[0].trim();
      const card = tokens[1].trim();
      const rawType = tokens[2].trim() as TransactionType;
      const title = tokens[3].replace(/^"|"$/g, '').trim() || (rawType === 'จ่ายบิล' ? 'ชำระบิลบัตร' : 'รายการทั่วไป');
      const rawAmount = tokens[4].replace(/["\s,]/g, '');
      const amount = Math.abs(parseFloat(rawAmount) || 0);
      const note = (tokens[5] || '').replace(/^"|"$/g, '').trim();

      const validTypes: TransactionType[] = ['ซื้อ', 'เงินคืน', 'จ่ายบิล'];
      const type: TransactionType = validTypes.includes(rawType) ? rawType : 'ซื้อ';

      const installment = extractInstallmentMeta(note, title);
      const category = inferCategory(title, note, type);

      result.push({
        id: `tx-seed-${i}-${Date.now().toString(36)}`,
        date,
        card,
        type,
        title,
        amount,
        note,
        category,
        installment,
        createdAt: new Date(date).getTime() || Date.now(),
        updatedAt: new Date(date).getTime() || Date.now(),
      });
    }
  }

  // Sort descending by date
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
