import { PropertyItem, PropertyMediaItem } from '../types/property';
import { uploadImageToDrive, uploadMediaToDrive, getOrCreateImagesFolder } from './googleDrive';
import { saveImageToLocalCache, extractDriveFileId, setMemoryImageCache, updatePropertyImageCache } from './imageStorage';

const SPREADSHEET_NAME = 'PropInvest_RealEstate_Records';
const SHEET_TAB_NAME = 'รายการทรัพย์สิน';

export const SHEET_COLUMNS = [
  'ID',
  'รูปภาพหลัก (คลิกเปิดดูใน Google Drive)',
  'ประเภททรัพย์',
  'จังหวัด',
  'อำเภอ/เขต',
  'ตำบล/แขวง',
  'โครงการ/หมู่บ้าน',
  'บ้านเลขที่',
  'ลิงก์แผนที่',
  'ราคาขาย (บาท)',
  'ค่าเช่า (บาท)',
  'ราคาประเมิน (บาท)',
  'ขนาดพื้นที่ (ตร.ว.)',
  'ราคาขายต่อตร.ว.',
  'เบอร์ติดต่อ',
  'จุดเด่น/หมายเหตุ',
  'วันที่บันทึก',
  'รูปภาพและวิดีโอทั้งหมด (สูงสุด 10 ไฟล์)',
  'ผู้บันทึก (Uploaded By)',
];

export interface UserSpreadsheetMeta {
  id: string;
  name: string;
  webViewLink: string;
}

/**
 * Find or create the user's personal Google Spreadsheet in their Drive
 */
export const getOrCreateUserSpreadsheet = async (accessToken: string): Promise<UserSpreadsheetMeta> => {
  // 1. Search if the file already exists in user's Drive
  const query = encodeURIComponent(`name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    console.error('Drive search failed:', errorText);
    throw new Error('ไม่สามารถค้นหา Google Sheet ใน Google Drive ของคุณได้');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const file = searchData.files[0];
    return {
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
    };
  }

  // 2. If not found, create a new spreadsheet for this user
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createPayload = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: [
      {
        properties: {
          title: SHEET_TAB_NAME,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error('Failed to create spreadsheet:', errorText);
    throw new Error('ไม่สามารถสร้าง Google Sheet ใหม่ในบัญชีของคุณได้');
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;

  // 3. Write header row
  const appendHeaderUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_TAB_NAME)}'!A1:R1:append?valueInputOption=USER_ENTERED`;
  await fetch(appendHeaderUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [SHEET_COLUMNS],
    }),
  });

  return {
    id: spreadsheetId,
    name: SPREADSHEET_NAME,
    webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
};

/**
 * Fetch all properties from the user's personal Google Sheet
 */
export const fetchPropertiesFromSheet = async (
  spreadsheetId: string,
  accessToken: string
): Promise<PropertyItem[]> => {
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_TAB_NAME)}'!A2:R1000?valueRenderOption=FORMULA`;

  const res = await fetch(readUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    // If sheet tab name doesn't match yet, try default sheet range
    const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:R1000?valueRenderOption=FORMULA`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!fallbackRes.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลจาก Google Sheet ได้');
    }
    const fallbackData = await fallbackRes.json();
    return parseSheetRows(fallbackData.values || []);
  }

  const data = await res.json();
  const items = parseSheetRows(data.values || []);

  // Auto-discover images from user's Drive folder for items missing images (strictly matching by property ID)
  try {
    const missingItems = items.filter(it => !extractDriveFileId(it.image) && !it.image?.startsWith('data:image'));
    if (missingItems.length > 0) {
      const folderId = await getOrCreateImagesFolder(accessToken);
      if (folderId) {
        const driveSearchUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,webViewLink)&pageSize=100`;
        const driveRes = await fetch(driveSearchUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (driveRes.ok) {
          const driveData = await driveRes.json();
          const driveFiles: Array<{ id: string; name: string; webViewLink?: string }> = driveData.files || [];
          for (const item of missingItems) {
            if (!item.id) continue;
            const matchedFile = driveFiles.find(f => f.name && f.name.includes(item.id));
            if (matchedFile) {
              item.image = matchedFile.webViewLink || `https://drive.google.com/file/d/${matchedFile.id}/view`;
            }
          }
        }
      }
    }
  } catch (driveErr) {
    console.warn('Auto drive image link note:', driveErr);
  }

  return items;
};

const parseSheetRows = (rows: any[][]): PropertyItem[] => {
  const seenIds = new Set<string>();

  return rows.map((row, index) => {
    let imgValue = row[1] || '';
    if (typeof imgValue === 'string') {
      const hyperlinkMatch = imgValue.match(/=HYPERLINK\(\s*["']([^"']+)["']/i);
      if (hyperlinkMatch && hyperlinkMatch[1]) {
        imgValue = hyperlinkMatch[1];
      } else {
        const imgMatch = imgValue.match(/=IMAGE\(\s*["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          imgValue = imgMatch[1];
        }
      }
    }

    const cleanNum = (val: any) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      const str = String(val).replace(/[^0-9.-]/g, '');
      return parseFloat(str) || 0;
    };

    const price = cleanNum(row[9]);
    const rentalPrice = cleanNum(row[10]);
    const appraisedPrice = cleanNum(row[11]);
    const areaSize = cleanNum(row[12]);
    const pricePerSqWa = cleanNum(row[13]) || (areaSize > 0 ? Math.round(price / areaSize) : 0);

    const rawId = (row[0] && String(row[0]).trim()) || `row-${index + 2}`;
    let uniqueId = rawId;
    if (seenIds.has(uniqueId)) {
      uniqueId = `${rawId}_row${index + 2}`;
    }
    seenIds.add(uniqueId);

    // Column R (index 17): All photos and videos (JSON or newline/comma separated URLs, up to 10 files)
    let mediaFiles: PropertyMediaItem[] = [];
    if (row[17]) {
      const rawMedia = String(row[17]).trim();
      try {
        if (rawMedia.startsWith('[') && rawMedia.endsWith(']')) {
          mediaFiles = JSON.parse(rawMedia);
        } else {
          const urls = rawMedia.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
          mediaFiles = urls.slice(0, 10).map((u, i) => {
            const isVid = /\.(mp4|mov|webm|mkv|avi|m4v)/i.test(u) || u.includes('video');
            return {
              id: `media-${uniqueId}-${i}`,
              url: u,
              type: isVid ? 'video' : 'image',
              fileName: `ไฟล์สื่อ ${i + 1}`,
              isCover: i === 0,
            };
          });
        }
      } catch (e) {
        console.warn('Failed to parse mediaFiles from sheet:', e);
      }
    }

    // If mediaFiles is empty but imgValue exists, create default cover media
    if (mediaFiles.length === 0 && imgValue) {
      mediaFiles.push({
        id: `media-cover-${uniqueId}`,
        url: imgValue,
        type: 'image',
        fileName: 'รูปภาพหน้าปก',
        isCover: true,
      });
    }

    if (mediaFiles.length > 0 && !mediaFiles.some(m => m.isCover)) {
      mediaFiles[0].isCover = true;
    }

    const coverItem = mediaFiles.find(m => m.isCover);

    return {
      id: uniqueId,
      sheetRowIndex: index + 2, // 1-indexed row in sheet (header is row 1)
      image: coverItem?.url || imgValue,
      mediaFiles: mediaFiles.slice(0, 10),
      propertyType: row[2] || 'บ้านเดี่ยว',
      country: 'ไทย',
      province: row[3] || '',
      district: row[4] || '',
      subDistrict: row[5] || '',
      village: row[6] || '',
      houseNumber: row[7] || '',
      mapLink: row[8] || '',
      price: price,
      rentalPrice: rentalPrice,
      appraisedPrice: appraisedPrice,
      areaSize: areaSize,
      pricePerSqWa: pricePerSqWa,
      contactNumber: row[14] || '',
      highlights: row[15] || '',
      dateAdded: row[16] || '',
      uploaderName: row[18] || '',
    };
  });
};

/**
 * Append new properties into the user's Google Sheet
 * Auto-uploads base64 images to Google Drive so they are openable with 1-click in the sheet!
 */
export const appendPropertiesToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  properties: PropertyItem[]
): Promise<void> => {
  if (properties.length === 0) return;

  // 1. Upload any base64 images to the user's dedicated Google Drive folder
  const folderId = await getOrCreateImagesFolder(accessToken);
  for (const p of properties) {
    if (p.image && !p.image.startsWith('http')) {
      try {
        const originalBase64 = p.image;
        const fileName = `prop_${p.id || 'scan'}_${Date.now()}`;
        const uploaded = await uploadImageToDrive(p.image, fileName, accessToken, folderId);
        p.image = uploaded.webViewLink;
        
        // Ensure mediaFiles array has this initial image as cover
        if (!p.mediaFiles || p.mediaFiles.length === 0) {
          p.mediaFiles = [
            {
              id: `m_${p.id || Date.now()}`,
              url: uploaded.webViewLink,
              fileId: uploaded.fileId,
              type: 'image',
              fileName: 'รูปภาพหน้าปก',
              isCover: true,
              dateAdded: new Date().toLocaleDateString('th-TH'),
            },
          ];
        }

        // Cache in local IndexedDB and memory so it displays instantly on web without showing stale placeholder
        await updatePropertyImageCache(p.id, originalBase64, uploaded.fileId);
      } catch (uploadErr) {
        console.warn('Failed to upload image to Google Drive:', uploadErr);
      }
    }
  }

  // 2. Append formatted rows into Google Sheet (18 columns: A through R)
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_TAB_NAME)}'!A1:R1:append?valueInputOption=USER_ENTERED`;

  const values = properties.map(p => {
    const today = p.dateAdded || new Date().toLocaleDateString('th-TH');
    const pricePerSqWa = p.areaSize > 0 ? Math.round(p.price / p.areaSize) : 0;
    
    // In Google Sheet: Clickable hyperlink that directly opens the original high-res photo in Google Drive
    let imageFormula = '';
    const coverUrl = p.mediaFiles?.find(m => m.isCover)?.url || p.image;
    if (coverUrl && coverUrl.startsWith('http')) {
      const label = `📷 เปิดดูรูปภาพ (${p.village || p.propertyType || 'ทรัพย์'})`;
      imageFormula = `=HYPERLINK("${coverUrl}", "${label}")`;
    }

    const mediaJson = p.mediaFiles && p.mediaFiles.length > 0
      ? JSON.stringify(p.mediaFiles.slice(0, 10))
      : (p.image ? JSON.stringify([{ id: `m_${p.id || Date.now()}`, url: p.image, type: 'image', isCover: true }]) : '');

    return [
      p.id,
      imageFormula,
      p.propertyType || 'บ้านเดี่ยว',
      p.province || '',
      p.district || '',
      p.subDistrict || '',
      p.village || '',
      p.houseNumber || '',
      p.mapLink || '',
      p.price || 0,
      p.rentalPrice || 0,
      p.appraisedPrice || 0,
      p.areaSize || 0,
      pricePerSqWa,
      p.contactNumber || '',
      p.highlights || '',
      today,
      mediaJson,
      p.uploaderName || 'Admin (เจ้าของทีม)',
    ];
  });

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error appending properties:', errorText);
    throw new Error('ไม่สามารถบันทึกข้อมูลลง Google Sheet ได้');
  }
};

/**
 * Update an existing property in the Google Sheet by row number
 */
export const updatePropertyInSheet = async (
  spreadsheetId: string,
  accessToken: string,
  property: PropertyItem
): Promise<void> => {
  let rowIndex = property.sheetRowIndex;

  // If rowIndex is missing, find the row index by searching property.id in column A
  if (!rowIndex) {
    try {
      let searchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_TAB_NAME)}'!A1:G1000`;
      let searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!searchRes.ok) {
        searchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:G1000`;
        searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
      if (searchRes.ok) {
        const data = await searchRes.json();
        const rows = data.values || [];
        for (let i = 0; i < rows.length; i++) {
          const rowId = rows[i] ? String(rows[i][0] || '').trim() : '';
          const rowVillage = rows[i] ? String(rows[i][6] || '').trim() : '';
          const targetId = String(property.id || '').trim();
          if (
            (rowId && targetId && rowId === targetId) ||
            (property.village && rowVillage && rowVillage.toLowerCase() === property.village.trim().toLowerCase())
          ) {
            rowIndex = i + 1;
            break;
          }
        }
      }
    } catch (searchErr) {
      console.warn('Row search note:', searchErr);
    }
  }

  if (!rowIndex) {
    throw new Error('ไม่พบตำแหน่งแถวใน Google Sheet เพื่อบันทึกรูปภาพและวิดีโอ');
  }

  // If image is a newly updated base64 string, upload to Drive
  if (property.image && !property.image.startsWith('http')) {
    try {
      const folderId = await getOrCreateImagesFolder(accessToken);
      const originalBase64 = property.image;
      const fileName = `prop_${property.province || 'thai'}_${property.village || 'image'}_${Date.now()}`;
      const uploaded = await uploadImageToDrive(property.image, fileName, accessToken, folderId);
      property.image = uploaded.webViewLink;
      if (property.id) saveImageToLocalCache(`prop_${property.id}`, originalBase64);
      if (uploaded.fileId) saveImageToLocalCache(`drive_${uploaded.fileId}`, originalBase64);
    } catch (uploadErr) {
      console.warn('Failed to upload image to Google Drive:', uploadErr);
    }
  }

  let updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(SHEET_TAB_NAME)}'!A${rowIndex}:R${rowIndex}?valueInputOption=USER_ENTERED`;

  const pricePerSqWa = property.areaSize > 0 ? Math.round(property.price / property.areaSize) : 0;
  
  const coverUrl = property.mediaFiles?.find(m => m.isCover)?.url || property.image;
  let imageFormula = '';
  if (coverUrl && coverUrl.startsWith('http')) {
    const label = `📷 เปิดดูรูปภาพ (${property.village || property.propertyType || 'ทรัพย์'})`;
    imageFormula = `=HYPERLINK("${coverUrl}", "${label}")`;
  }

  const mediaJson = property.mediaFiles && property.mediaFiles.length > 0
    ? JSON.stringify(property.mediaFiles.slice(0, 10))
    : '';

  const values = [
    [
      property.id,
      imageFormula,
      property.propertyType || 'บ้านเดี่ยว',
      property.province || '',
      property.district || '',
      property.subDistrict || '',
      property.village || '',
      property.houseNumber || '',
      property.mapLink || '',
      property.price || 0,
      property.rentalPrice || 0,
      property.appraisedPrice || 0,
      property.areaSize || 0,
      pricePerSqWa,
      property.contactNumber || '',
      property.highlights || '',
      property.dateAdded || new Date().toLocaleDateString('th-TH'),
      mediaJson,
    ],
  ];

  let res = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    // Fallback without explicit sheet name if renamed
    updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A${rowIndex}:R${rowIndex}?valueInputOption=USER_ENTERED`;
    res = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error updating property in sheet:', errorText);
    throw new Error('ไม่สามารถอัปเดตข้อมูลใน Google Sheet ได้');
  }
};

/**
 * Upload one or more photos or videos to Google Drive and attach to a property in Google Sheet
 * Supports maximum of 10 media files per property
 */
export const uploadAndAddMediaToProperty = async (
  spreadsheetId: string,
  accessToken: string,
  property: PropertyItem,
  newFiles: File[],
  onProgress?: (current: number, total: number, fileName: string) => void,
  asCover: boolean = false
): Promise<PropertyItem> => {
  const currentMedia = property.mediaFiles || [];
  if (currentMedia.length >= 10) {
    throw new Error('ทรัพย์สินนี้บันทึกรูปภาพและวิดีโอครบจำนวนจำกัด 10 ไฟล์แล้ว');
  }

  const availableSlots = 10 - currentMedia.length;
  const filesToUpload = newFiles.slice(0, availableSlots);

  const folderId = await getOrCreateImagesFolder(accessToken);
  const newlyAddedMedia: PropertyMediaItem[] = [];

  for (let i = 0; i < filesToUpload.length; i++) {
    const file = filesToUpload[i];
    if (onProgress) {
      onProgress(i + 1, filesToUpload.length, file.name);
    }

    const safeTitle = (property.village || property.propertyType || 'prop').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_');
    const fileName = `${safeTitle}_${Date.now()}_${i}_${file.name}`;
    
    const uploaded = await uploadMediaToDrive(file, fileName, accessToken, folderId);
    const isFirstEver = currentMedia.length === 0 && i === 0;
    const isThisCover = (asCover && i === 0) || isFirstEver;

    // Cache the uploaded media blob in both memory and IndexedDB immediately for instant render
    if (uploaded.fileId) {
      setMemoryImageCache(uploaded.fileId, file);
      saveImageToLocalCache(`drive_${uploaded.fileId}`, file);
    }

    const mediaItem: PropertyMediaItem = {
      id: `media_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      url: uploaded.webViewLink,
      fileId: uploaded.fileId,
      type: uploaded.type,
      fileName: file.name,
      thumbnailUrl: uploaded.directThumbnailUrl,
      sizeBytes: file.size,
      dateAdded: new Date().toLocaleDateString('th-TH'),
      isCover: isThisCover,
    };

    newlyAddedMedia.push(mediaItem);
  }

  let baseMedia = currentMedia;
  if (asCover && newlyAddedMedia.length > 0) {
    // If setting newly uploaded file as cover, unmark existing covers
    baseMedia = currentMedia.map(m => ({ ...m, isCover: false }));
  }

  const updatedMediaList = [...baseMedia, ...newlyAddedMedia].slice(0, 10);
  
  // Ensure cover image
  const coverItem = updatedMediaList.find(m => m.isCover) || updatedMediaList[0];
  const newImageUrl = (asCover && newlyAddedMedia[0]) ? newlyAddedMedia[0].url : (coverItem?.url || property.image);

  const updatedProperty: PropertyItem = {
    ...property,
    mediaFiles: updatedMediaList,
    image: newImageUrl,
  };

  // Update property-level cache so card immediately shows the uploaded image
  if (newlyAddedMedia.length > 0) {
    const primaryFile = filesToUpload[0];
    const primaryFileId = newlyAddedMedia[0].fileId;
    if (asCover || currentMedia.length === 0) {
      await updatePropertyImageCache(property.id, primaryFile, primaryFileId);
    }
  }

  // Sync to Google Sheet
  await updatePropertyInSheet(spreadsheetId, accessToken, updatedProperty);

  return updatedProperty;
};

/**
 * Remove a photo or video from a property and sync with Google Sheet
 */
export const deleteMediaFromProperty = async (
  spreadsheetId: string,
  accessToken: string,
  property: PropertyItem,
  mediaId: string
): Promise<PropertyItem> => {
  const currentMedia = property.mediaFiles || [];
  const filtered = currentMedia.filter(m => m.id !== mediaId);

  // If the deleted media was the cover, assign the next one as cover
  if (filtered.length > 0 && !filtered.some(m => m.isCover)) {
    filtered[0].isCover = true;
  }

  const coverItem = filtered.find(m => m.isCover) || filtered[0];

  const updatedProperty: PropertyItem = {
    ...property,
    mediaFiles: filtered,
    image: coverItem?.url || (filtered.length === 0 ? '' : property.image),
  };

  await updatePropertyInSheet(spreadsheetId, accessToken, updatedProperty);
  return updatedProperty;
};

/**
 * Set a specific photo as the primary cover photo for a property and update Google Sheet
 */
export const setCoverMediaForProperty = async (
  spreadsheetId: string,
  accessToken: string,
  property: PropertyItem,
  mediaId: string
): Promise<PropertyItem> => {
  const currentMedia = property.mediaFiles || [];
  const updatedMedia = currentMedia.map(m => ({
    ...m,
    isCover: m.id === mediaId,
  }));

  const chosenCover = updatedMedia.find(m => m.id === mediaId);

  const updatedProperty: PropertyItem = {
    ...property,
    mediaFiles: updatedMedia,
    image: chosenCover ? chosenCover.url : property.image,
  };

  if (chosenCover) {
    if (chosenCover.fileId) {
      await updatePropertyImageCache(property.id, chosenCover.url, chosenCover.fileId);
    }
  }

  await updatePropertyInSheet(spreadsheetId, accessToken, updatedProperty);
  return updatedProperty;
};

/**
 * Delete a property row from Google Sheet
 */
export const deletePropertyFromSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetRowIndex: number
): Promise<void> => {
  // First get the sheetId (gid)
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metaRes.ok) throw new Error('ไม่สามารถตรวจสอบข้อมูลชีตได้');
  const metaData = await metaRes.json();
  const sheetId = metaData.sheets?.[0]?.properties?.sheetId || 0;

  // Batch update deleteDimension (0-indexed, end index is exclusive)
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const res = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: sheetRowIndex - 1,
              endIndex: sheetRowIndex,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error('ไม่สามารถลบแถวออกจาก Google Sheet ได้');
  }
};
