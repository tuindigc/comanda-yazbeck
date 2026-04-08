
export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Convert to compressed jpeg
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Pre-loads an image URL and converts it to base64 for jsPDF embedding.
 * Returns null if the image fails to load (CORS, 404, etc).
 */
export const imageUrlToBase64 = (url: string, maxSize = 80): Promise<string | null> => {
    if (!url) return Promise.resolve(null);
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            if (w > h) {
                if (w > maxSize) { h *= maxSize / w; w = maxSize; }
            } else {
                if (h > maxSize) { w *= maxSize / h; h = maxSize; }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
};

/**
 * Pre-loads all unique images from cart items for PDF embedding.
 * Returns a Map of imageUrl -> base64 string.
 */
export const preloadCartImagesForPDF = async (
    items: { imageUrl?: string }[]
): Promise<Map<string, string>> => {
    const uniqueUrls = [...new Set(items.map(i => i.imageUrl).filter(Boolean))] as string[];
    const results = new Map<string, string>();

    await Promise.all(
        uniqueUrls.map(async (url) => {
            const base64 = await imageUrlToBase64(url);
            if (base64) results.set(url, base64);
        })
    );

    return results;
};
