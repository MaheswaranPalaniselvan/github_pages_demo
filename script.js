document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const keySizeSelect = document.getElementById('key-size');
    const keysContainer = document.getElementById('keys-container');
    const publicKeyArea = document.getElementById('public-key');
    const privateKeyArea = document.getElementById('private-key');
    const actionBtns = document.querySelectorAll('.action-btn');
    const toast = document.getElementById('toast');

    // UI Helpers
    const showLoader = (isLoading) => {
        const btnText = generateBtn.querySelector('.btn-text');
        const btnIcon = generateBtn.querySelector('.btn-icon');
        const loader = generateBtn.querySelector('.loader');

        if (isLoading) {
            btnText.textContent = 'Generating...';
            btnIcon.classList.add('hidden');
            loader.classList.remove('hidden');
            generateBtn.disabled = true;
        } else {
            btnText.textContent = 'Generate New Keys';
            btnIcon.classList.remove('hidden');
            loader.classList.add('hidden');
            generateBtn.disabled = false;
        }
    };

    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatPEM = (b64Key, type) => {
        const header = type === 'public' ? '-----BEGIN PUBLIC KEY-----' : '-----BEGIN PRIVATE KEY-----';
        const footer = type === 'public' ? '-----END PUBLIC KEY-----' : '-----END PRIVATE KEY-----';

        let pemKey = header + '\n';
        while (b64Key.length > 0) {
            pemKey += b64Key.substring(0, 64) + '\n';
            b64Key = b64Key.substring(64);
        }
        pemKey += footer;
        return pemKey;
    };

    // Core Key Generation Logic
    const generateKeys = async () => {
        const keySize = parseInt(keySizeSelect.value);
        showLoader(true);
        keysContainer.classList.add('hidden');

        try {
            // Give UI a moment to update
            await new Promise(resolve => setTimeout(resolve, 100));

            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSASSA-PKCS1-v1_5",
                    modulusLength: keySize,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["sign", "verify"]
            );

            // Export Keys
            const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
            const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

            // Convert to PEM
            const publicKeyB64 = arrayBufferToBase64(publicKeyBuffer);
            const privateKeyB64 = arrayBufferToBase64(privateKeyBuffer);

            const publicKeyPEM = formatPEM(publicKeyB64, 'public');
            const privateKeyPEM = formatPEM(privateKeyB64, 'private');

            // Update UI
            publicKeyArea.value = publicKeyPEM;
            privateKeyArea.value = privateKeyPEM;

            keysContainer.classList.remove('hidden');

            // Resize textareas to fit content
            publicKeyArea.style.height = 'auto';
            publicKeyArea.style.height = (publicKeyArea.scrollHeight + 2) + 'px';

            privateKeyArea.style.height = 'auto';
            privateKeyArea.style.height = (privateKeyArea.scrollHeight + 2) + 'px';

            // Scroll to results
            keysContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error(error);
            alert('Error generating keys: ' + error.message);
        } finally {
            showLoader(false);
        }
    };

    // Action Handlers
    const handleCopy = async (targetId) => {
        const text = document.getElementById(targetId).value;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy!', err);
            // Fallback
            const textArea = document.getElementById(targetId);
            textArea.select();
            document.execCommand('copy');
            showToast('Copied to clipboard!');
        }
    };

    const handleDownload = (targetId, filename) => {
        const text = document.getElementById(targetId).value;
        if (!text) return;

        const element = document.createElement('a');
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element); // Required for Firefox
        element.click();
        document.body.removeChild(element);
    };

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    };

    // Event Listeners
    generateBtn.addEventListener('click', generateKeys);

    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Handle bubbled clicks (if icon is clicked)
            const button = e.target.closest('button');
            const action = button.dataset.action;
            const targetId = button.dataset.target;

            if (action === 'copy') {
                handleCopy(targetId);
            } else if (action === 'download') {
                const filename = button.dataset.filename;
                handleDownload(targetId, filename);
            }
        });
    });
});
