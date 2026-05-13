# ===================================
# CLOUDINARY SETUP GUIDE
# ===================================

## Why Cloudinary?

Cloudinary is a cloud-based image and video management service that handles:
- ✅ Image storage (no need for local filesystem)
- ✅ Automatic optimization (WebP, compression)
- ✅ On-the-fly transformations (resize, crop)
- ✅ Global CDN delivery (fast worldwide)
- ✅ FREE tier: 25GB storage, 25GB bandwidth/month

## Getting Cloudinary Credentials

### Step 1: Create Account
1. Go to https://cloudinary.com
2. Click "Sign Up Free"
3. Enter email, password
4. Verify email

### Step 2: Get Credentials
1. Log in to Cloudinary dashboard
2. You'll see "Account Details" on the right
3. Copy these values:
   - **Cloud Name**: `dxxxxxxxxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz123456`

### Step 3: Update .env File
Open `backend/.env` and replace:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here  
CLOUDINARY_API_SECRET=your_api_secret_here
```

With your actual values:

```env
CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### Step 4: Restart Server
```bash
# Stop server (Ctrl+C)
# Start server
npm run dev
```

You should see:
```
✅ Cloudinary configured: dxxxxxxxxxxxxx
```

## Testing Upload

### Using Postman or Thunder Client

**1. Upload Image**
- Method: POST
- URL: `http://localhost:5000/api/upload/image`
- Headers:
  - `Authorization: Bearer YOUR_JWT_TOKEN`
- Body: form-data
  - Key: `image` (select File type)
  - Value: Select an image file

**2. Response (Success)**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://res.cloudinary.com/.../image.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../w_400,h_300/image.jpg",
    "cloudinaryId": "designhub/designs/abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "size": 245678
  }
}
```

### Using PowerShell

```powershell
# Login first to get token
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{email="test@test.com"; password="Password123!"} | ConvertTo-Json)
$token = $login.token

# Upload image
$imagePath = "C:\path\to\your\image.jpg"
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
$boundary = [System.Guid]::NewGuid().ToString()

$LF = "`r`n"
$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"image`"; filename=`"image.jpg`"",
    "Content-Type: image/jpeg$LF",
    [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($imageBytes),
    "--$boundary--$LF"
) -join $LF

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/upload/image" -Method POST -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
} -Body $bodyBytes

$response.data
```

## Frontend Integration (React)

```jsx
import { useState } from 'react';
import axios from 'axios';

function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/upload/image',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setImageUrl(response.data.data.imageUrl);
      alert('Upload successful!');
    } catch (error) {
      alert('Upload failed: ' + error.response?.data?.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" style={{maxWidth: '400px'}} />}
    </div>
  );
}
```

## Troubleshooting

### Error: "Cloudinary configuration error"
- Check if .env file has correct credentials
- Restart server after updating .env
- Make sure no quotes around values in .env

### Error: "Invalid file type"
- Only image files allowed: JPG, PNG, GIF, WebP
- Check file extension and MIME type

### Error: "File too large"
- Max file size: 5MB
- Compress image before uploading
- Use online tools like TinyPNG

### Error: "Failed to upload image"
- Check internet connection
- Verify Cloudinary credentials are correct
- Check Cloudinary dashboard for quota limits

## Cloudinary Dashboard

View uploaded images:
1. Go to https://cloudinary.com/console/media_library
2. Navigate to "designhub/designs" folder
3. See all uploaded images with metadata

## Next Steps

After Cloudinary is working:
1. ✅ Update design creation to use upload endpoint
2. ✅ Add image preview in frontend
3. ✅ Add progress bar during upload
4. ✅ Delete old image when updating design
5. ✅ Add image compression on frontend (optional)
