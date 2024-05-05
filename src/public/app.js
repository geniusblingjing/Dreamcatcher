window.onload = function() {
    const analyzeButton = document.getElementById('analyze-button');
    const generateImageButton = document.getElementById('generate-image-button');
    const downloadButton = document.getElementById('download-button'); // Ensure it's defined
    const dreamInput = document.getElementById('dream-input');
    const resultsContainer = document.getElementById('results-container');
    const resultsContainer2 = document.getElementById('result-box');
    const loadingIndicator = document.getElementById('loadingIndicator');

    let isAnalysisComplete = false;
    let isImageGenerated = false;

    analyzeButton.addEventListener('click', async function() {
        const dreamDescription = dreamInput.value.trim();
        const prompt = `Please analyze the following dream: "${dreamDescription}". Provide an interpretation focusing on symbolic meanings and emotions.`;
        loadingIndicator.style.display = 'block';
        const analysis = await analyzeDream(prompt);
        loadingIndicator.style.display = 'none';
        displayStructuredResults(dreamDescription, analysis);
        isAnalysisComplete = true;
        checkDownloadAvailability(); // Check after analysis
    });

    generateImageButton.addEventListener('click', async function () {
        const dreamDescription = dreamInput.value.trim();
        if (!dreamDescription) {
            alert("Please describe your dream");
            return;
        }
        loadingIndicator.style.display = 'block';
        const imageUrl = await generateImage(dreamDescription);
        loadingIndicator.style.display = 'none';
        await displayImage(imageUrl); // Wait until the image is loaded
        isImageGenerated = true; // Correctly set the flag after image has loaded
        checkDownloadAvailability(); // Check after image generation
    });

    async function analyzeDream(prompt) {
        console.log("Prompt being sent:", prompt); // Log the prompt
        try {
            const response = await fetch('/api/gpt?prompt=' + encodeURIComponent(prompt), {
                method: 'GET'
            });
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const data = await response.text();
            console.log("API response:", data); // Log the API response
            return data;
        } catch (error) {
            console.error('Failed to fetch:', error);
            return 'Error: ' + error.message;
        }
    }

    async function generateImage(dreamDescription) {
        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dream: dreamDescription })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.imageUrl;
        } catch (error) {
            console.error('Error:', error);
            return '';
        }
    }

    async function displayImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const imageContainer = document.getElementById('image-results');
            const imageElement = new Image();
            imageElement.src = imageUrl;
            imageElement.alt = "Dream Image";
            imageElement.onload = function() {
                imageContainer.innerHTML = ''; // Clear previous image
                imageContainer.appendChild(imageElement); // Append new image
                resolve(); // Resolve the promise when the image has loaded
            };
            imageElement.onerror = function() {
                reject(new Error('Failed to load image'));
            };
        });
    }
    

    function displayStructuredResults(description, analysis) {
        resultsContainer.innerHTML = `
            <div id="result-box">
                <h2>Description: ${description}</h2>
                <div id="analysis"><strong>Creative Analysis:</strong> ${analysis}</div>
                <div id="image-results"></div>
            </div>
        `;

    }

    function checkDownloadAvailability() {
        if (isAnalysisComplete && isImageGenerated) {
            downloadButton.style.display = 'block'; // Show the download button
        }
    }

    downloadButton.addEventListener('click', saveContent);

    function downloadContainerAsImage() {
        setTimeout(() => {
            html2canvas(resultsContainer, {
                logging: true, // Enable logging
                onclone: (doc) => {
                    // Ensure that the image is fully loaded before capturing
                    const images = doc.getElementsByTagName('img');
                    const promises = [];
                    for (let i = 0; i < images.length; i++) {
                        const promise = new Promise((resolve) => {
                            if (!images[i].complete) {
                                images[i].addEventListener('load', resolve);
                            } else {
                                resolve();
                            }
                        });
                        promises.push(promise);
                    }
                    return Promise.all(promises);
                }
            }).then(canvas => {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = 'results.png'; // Set the file name
                document.body.appendChild(link); // Append link to the body
                console.log(link)
                link.click(); // Trigger the download
                document.body.removeChild(link); // Clean up
            }).catch(error => {
                console.error('Error during rendering:', error);
            });
        }, 1000);
    }
    
    function saveContent() {
        // Get the HTML content of the container
        var contentContainer = document.getElementById('result-box');
        var htmlContent = contentContainer.innerHTML;
    
        // Convert HTML content to Blob
        var blob = new Blob([htmlContent], { type: 'text/html' });
    
        // Create a URL for the Blob
        var blobUrl = URL.createObjectURL(blob);
    
        // Create a link element
        var a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'content.html';
        document.body.appendChild(a);
        
        // Programmatically click the link to trigger the download
        a.click();
    
        // Clean up
        window.URL.revokeObjectURL(blobUrl);
        a.remove();
    }
    





};
