'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DeleteIcon, LoadingIcon } from '@//src/app/app-constants';
import Image from 'next/image';
import toast from 'react-hot-toast';


export default function ImageUploader() {
    const { id } = useParams();
    const [file, setFile] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [checkingImage, setCheckingImage] = useState(true);

    useEffect(() => {
        const fetchImageInfo = async () => {
            try {
                const res = await fetch(`/api/get-user?id=${id}`);
                const data = await res.json();

                if (res.ok && data?.image) {
                    const imageUrl = `/userImage/${data.image}`;
                    const imageRes = await fetch(imageUrl, { method: 'HEAD' });

                    if (imageRes.ok) {
                        setUploadResult({ url: imageUrl });
                    }
                }
            } catch (err) {
                console.error('Error checking image:', err);
            } finally {
                setCheckingImage(false);
            }
        };

        if (id) fetchImageInfo();
    }, [id]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setErrorMsg(null);

        if (selectedFile) {
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

                if (res.ok) {
                    setUploadResult(data);
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
        }
    };

    const handleDelete = async () => {
        if (!uploadResult?.url) return;
        setLoading(true);
        setErrorMsg(null);

        try {
            const res = await fetch('/api/delete-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    userId: `AK-${id}`,
                    fileName: uploadResult.url.split('/').pop(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setUploadResult(null);
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
                <>
                    <div className="boxFileImage">
                        {uploadResult?.url ? (
                            <Image
                                fill
                                src={`${uploadResult.url}?t=${Date.now()}`}
                                alt="Uploaded"
                            />
                        ) : (
                            <>
                                {loading ? (
                                    <img
                                        src="https://placehold.co/300x300?text=Loading%20Image"
                                        alt="Placeholder"
                                    />
                                ) : (
                                    <img
                                        src="https://placehold.co/300x300?text=Upload%20User%20Image"
                                        alt="Placeholder"
                                    />
                                )

                                }

                                <input type="file" onChange={handleFileChange} disabled={loading} />
                            </>
                        )}
                        {uploadResult?.url && (
                            <div onClick={handleDelete} className="deleteBtn">
                                <DeleteIcon />
                            </div>
                        )}
                    </div>


                </>
            )}

            {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        </div>
    );
}
