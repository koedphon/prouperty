export interface DriveUploadedFile {
  fileId: string;
  webViewLink: string;
  directThumbnailUrl: string;
}

export interface DriveUploadedMedia {
  fileId: string;
  webViewLink: string;
  directThumbnailUrl: string;
  mimeType: string;
  type: 'image' | 'video';
  fileName: string;
}

let cachedFolderId: string | null = null;

/**
 * Find or create a dedicated 'PropInvest_Property_Images' folder in user's Drive
 */
export const getOrCreateImagesFolder = async (accessToken: string): Promise<string | null> => {
  if (cachedFolderId) return cachedFolderId;

  try {
    const folderName = 'PropInvest_Property_Images';
    const query = encodeURIComponent(
      `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

    const res = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        cachedFolderId = data.files[0].id;
        return cachedFolderId;
      }
    }

    // Create new folder
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      cachedFolderId = created.id;
      return cachedFolderId;
    }
  } catch (e) {
    console.warn('Folder creation warning:', e);
  }

  return null;
};

/**
 * Upload a photo or video (File, Blob, or Base64) directly into the user's Google Drive folder
 * Automatically handles MIME types (JPEG, PNG, MP4, MOV, WEBM)
 * Grants reader permission so the file can be viewed anywhere
 */
export const uploadMediaToDrive = async (
  fileOrBlobOrBase64: File | Blob | string,
  fileName: string,
  accessToken: string,
  folderId?: string | null
): Promise<DriveUploadedMedia> => {
  let mimeType = 'image/jpeg';
  let fileBlob: Blob;

  if (typeof fileOrBlobOrBase64 === 'string') {
    let base64Data = fileOrBlobOrBase64;
    if (fileOrBlobOrBase64.includes(';base64,')) {
      const parts = fileOrBlobOrBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      base64Data = parts[1];
    }
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    fileBlob = new Blob([bytes], { type: mimeType });
  } else if (fileOrBlobOrBase64 instanceof File) {
    mimeType = fileOrBlobOrBase64.type || (fileName.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');
    fileBlob = fileOrBlobOrBase64;
  } else {
    mimeType = fileOrBlobOrBase64.type || 'image/jpeg';
    fileBlob = fileOrBlobOrBase64;
  }

  const isVideo = mimeType.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(fileName);
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';

  let cleanName = fileName;
  if (!/\.[a-zA-Z0-9]+$/.test(cleanName)) {
    cleanName = isVideo ? `${cleanName}.mp4` : `${cleanName}.jpg`;
  }

  // Step 1: Create file metadata in Drive
  const metaPayload: any = {
    name: cleanName,
    mimeType: mimeType,
  };
  if (folderId) {
    metaPayload.parents = [folderId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metaPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Failed to create file metadata in Drive:', errText);
    throw new Error('ไม่สามารถสร้างไฟล์ใน Google Drive ได้');
  }

  const fileData = await createRes.json();
  const fileId = fileData.id;
  const webViewLink = fileData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  const directThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

  // Step 2: Upload raw media binary to the created file
  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: fileBlob,
    }
  );

  if (!uploadRes.ok) {
    const errUploadText = await uploadRes.text();
    console.error('Failed to upload media binary to Drive:', errUploadText);
    throw new Error('ไม่สามารถอัปโหลดข้อมูลไฟล์สื่อไปยัง Google Drive ได้');
  }

  // Step 3: Set permission to anyone with link can view (allows sheet and web previews)
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Set permission note:', permErr);
  }

  return {
    fileId,
    webViewLink,
    directThumbnailUrl,
    mimeType,
    type: mediaType,
    fileName: cleanName,
  };
};

/**
 * Upload a Base64 property image directly into the user's Google Drive
 */
export const uploadImageToDrive = async (
  base64OrDataUrl: string,
  fileName: string,
  accessToken: string,
  folderId?: string | null
): Promise<DriveUploadedFile> => {
  const result = await uploadMediaToDrive(base64OrDataUrl, fileName, accessToken, folderId);
  return {
    fileId: result.fileId,
    webViewLink: result.webViewLink,
    directThumbnailUrl: result.directThumbnailUrl,
  };
};
