async function loadBaseTemplate() {
  try {
    const response = await fetch('/public/nextjsbasetemplate.zip');
    if (!response.ok) throw new Error('Failed to fetch template');
    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    return zip;
  } catch (error) {
    console.error('Error loading base template:', error);
    alert('Failed to load template. Please try again.');
    return null;
  }
}

document.getElementById('customizeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get user inputs
  const logoFile = document.getElementById('logoInput').files[0];
  const companyId = document.getElementById('companyId').value.trim();
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const selectedTheme = document.getElementById('themeSelect').value;

  // Validate inputs
  if (!logoFile || !companyId || !apiUrl) {
    alert('Please provide logo, company ID, and API URL.');
    return;
  }

  // Validate logo file
  if (logoFile.type !== 'image/png') {
    alert('Please upload a PNG file.');
    return;
  }
  if (logoFile.size > 2 * 1024 * 1024) {
    alert('Logo file size must be less than 2MB.');
    return;
  }

  // Validate theme
  if (!selectedTheme) {
    alert('Please select a theme (Basic or Luxury).');
    return;
  }
  const validThemes = ['basic', 'luxury'];
  if (!validThemes.includes(selectedTheme)) {
    alert('Invalid theme selected. Please choose Basic or Luxury.');
    return;
  }

  // Validate company ID
  const companyIdRegex = /^[a-zA-Z0-9]{3,50}$/;
  if (!companyIdRegex.test(companyId)) {
    alert('Company ID must be 3-50 characters long and contain only letters and numbers.');
    return;
  }

  // Validate API URL
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  if (!urlRegex.test(apiUrl)) {
    alert('Please enter a valid API URL (e.g., https://api.mycompany.com).');
    return;
  }

  // Load base template
  const zip = await loadBaseTemplate();
  if (!zip) return;

  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.textContent = 'Generating...';
  submitButton.disabled = true;

  try {
    // Replace logo
    const logoArrayBuffer = await logoFile.arrayBuffer();
    zip.file('jewel-webapp-theme/public/assets/user/icons/webLogo.png', logoArrayBuffer);

    // Update config.json
    const config = {
      NEXT_PUBLIC_API_URL: apiUrl,
      COMPANY_ID: companyId
    };
    zip.file('jewel-webapp-theme/config.json', JSON.stringify(config, null, 2));

    // Update theme.config.json
    const themeConfig = {
      activeTheme: selectedTheme,
      themes: [
        { id: "basic", name: "Basic Theme" },
        { id: "luxury", name: "Luxury Theme" }
      ]
    };
    zip.file('jewel-webapp-theme/theme.config.json', JSON.stringify(themeConfig, null, 2));

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `customized-nextjs-app-${companyId}.zip`);
  } catch (error) {
    console.error('Error generating zip:', error);
    alert('Failed to generate customized app. Please try again.');
  } finally {
    submitButton.textContent = 'Generate & Download';
    submitButton.disabled = false;

    // Reset form inputs and image picker (except theme selection)
    const form = document.getElementById('customizeForm');
    document.getElementById('logoInput').value = ''; // Clear file input
    document.getElementById('companyId').value = ''; // Clear company ID
    document.getElementById('apiUrl').value = ''; // Clear API URL
    const fileDisplay = document.getElementById('fileDisplay');
    fileDisplay.classList.remove('has-file');
    fileDisplay.innerHTML = `
      <div class="flex flex-col items-center py-6">
        <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p class="text-gray-600 font-normal text-center">
          <span class="text-maroon font-medium">Click to upload</span> or drag and drop<br>
          <span class="text-sm">PNG file • Transparent background • Max 2MB</span><br>
          <span class="text-sm">Recommended size: <strong>360×96 px</strong></span>
        </p>
      </div>
    `;

    // Reset sliders
    currentSlide = { basic: 0, luxury: 0 };
    document.querySelectorAll('.theme-slider-inner').forEach(slider => {
      slider.style.transform = 'translateX(0%)'; // Reset slider position
    });
  }
});