'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DeleteIcon, LoadingIcon } from '@/src/app/app-constants';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function ImageUploader() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null); // { url: string } | null
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [checkingImage, setCheckingImage] = useState(true);

  // 🔹 Load existing image (Cloudinary URL stored in Sheets)
  const fetchImageInfo = async () => {
    try {
      const res = await fetch(`/api/get-user?id=${id}`);
      const data = await res.json();

      if (res.ok && data?.image) {
        setUploadResult({ url: data.image }); // ✅ direct Cloudinary link
      } else {
        setUploadResult(null);
      }
    } catch (err) {
      console.error('Error checking image:', err);
    } finally {
      setCheckingImage(false);
    }
  };

  useEffect(() => {
    if (id) fetchImageInfo();
  }, [id]);

  // 🔹 Upload image
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('id', id);
      formData.append('userId', `AK-${id}`);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data?.url) {
        setUploadResult({ url: data.url }); // ✅ instantly show uploaded image
        setFile(null);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Something went wrong during upload.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete image
  const handleDelete = async () => {
    if (!uploadResult?.url) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: `AK-${id}` }),
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResult(null); // ✅ instantly show placeholder again
        setFile(null);
        toast.success('Image deleted successfully!');
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Something went wrong during deletion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="imageBox">
      {checkingImage ? (
        <div className="LoadingIcon">
          <LoadingIcon />
        </div>
      ) : (
        <div className="boxFileImage">
          {uploadResult?.url ? (
            <>
              <Image
                fill
                src={uploadResult.url} // ✅ Cloudinary URL
                alt="Uploaded"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div onClick={handleDelete} className="deleteBtn">
                <DeleteIcon />
              </div>
            </>
          ) : (
            <>
              <Image
                width={300}
                height={300}
                src={
                  loading
                    ? 'https://res.cloudinary.com/dqssp4sg2/image/upload/v1755692357/uploadImage_wi1oqt.svg'
                    : 'https://res.cloudinary.com/dqssp4sg2/image/upload/v1755692468/userImage_uaok12.svg'
                }
                alt="Placeholder"
              />
              <input type="file" onChange={handleFileChange} disabled={loading} />
            </>
          )}
        </div>
      )}

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
    </div>
  );
}
