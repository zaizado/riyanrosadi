/**
 * Utility to compress and resize image files or data URLs to ensure
 * they remain lightweight (< 80KB) and safely fit in Firestore and LocalStorage.
 */

export const compressImage = (
  input: File | string,
  maxWidth = 250,
  maxHeight = 250,
  quality = 0.65
): Promise<string> => {
  return new Promise((resolve) => {
    if (!input) {
      resolve('');
      return;
    }

    const img = new Image();

    const processImage = () => {
      try {
        let width = img.width || maxWidth;
        let height = img.height || maxHeight;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          let compressed = canvas.toDataURL('image/jpeg', quality);

          // If over 100,000 chars, compress more aggressively
          if (compressed.length > 100000) {
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = Math.min(canvas.width, 180);
            smallCanvas.height = Math.min(canvas.height, 180);
            const smallCtx = smallCanvas.getContext('2d');
            if (smallCtx) {
              smallCtx.fillStyle = '#FFFFFF';
              smallCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
              smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
              compressed = smallCanvas.toDataURL('image/jpeg', 0.55);
            }
          }

          resolve(compressed);
        } else {
          resolve(typeof input === 'string' ? input : img.src);
        }
      } catch (err) {
        console.error('Canvas compression error:', err);
        resolve(typeof input === 'string' ? input : '');
      }
    };

    img.onerror = () => {
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      if (!input.startsWith('data:image')) {
        // HTTP URL or static asset path
        resolve(input);
        return;
      }
      img.src = input;
      if (img.complete) processImage();
      else img.onload = processImage;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
        img.onload = processImage;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
};
