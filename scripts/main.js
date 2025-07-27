document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copy-btn');
    const zenText = document.getElementById('zen-text').textContent;

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(zenText).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Zen';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
});
