let mediaRecorder;
let audioChunks = [];

function startRecording() {
     navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
          mediaRecorder.start();
          document.querySelector(
               "button[onclick='stopRecording()']"
          ).disabled = false;
          document.querySelector(
               "button[onclick='startRecording()']"
          ).disabled = true;

          mediaRecorder.addEventListener("dataavailable", (event) => {
               audioChunks.push(event.data);
          });

          mediaRecorder.addEventListener("stop", () => {
               const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
               const reader = new FileReader();
               reader.readAsDataURL(audioBlob);
               reader.onloadend = () => {
                    const base64data = reader.result;
                    fetch("/process_audio", {
                         method: "POST",
                         headers: {
                              "Content-Type": "application/json",
                         },
                         body: JSON.stringify({ audio_data: base64data }),
                    })
                         .then((response) => {
                              if (!response.ok) {
                                   return response.json().then((error) => {
                                        throw new Error(error.error);
                                   });
                              }
                              return response.json();
                         })
                         .then((data) => {
                              if (data.error) {
                                   document.getElementById("output").innerText = data.error;
                              } else {
                                   document.getElementById("output").innerText =
                                        data.match_result
                                             ? "The user-provided information is relevant."
                                             : "The user-provided information does not match.";
                                   document.getElementById("correctKeywords").innerText =
                                        data.dataset_keywords.join(", ");
                                   document.getElementById("matchedKeywords").innerText =
                                        data.user_keywords.join(", ");
                                   document.getElementById(
                                        "accuracy"
                                   ).innerText = `Information matched(%: ${data.accuracy.toFixed(
                                        2
                                   )}%`;
                              }
                         })
                         .catch((error) => {
                              document.getElementById(
                                   "output"
                              ).innerText = `Error: ${error.message}`;
                         });
               };
          });
     });
}

function stopRecording() {
     mediaRecorder.stop();
     document.querySelector(
          "button[onclick='stopRecording()']"
     ).disabled = true;
     document.querySelector(
          "button[onclick='startRecording()']"
     ).disabled = false;
     audioChunks = [];
}

function uploadAudio() {
     const audioFile = document.getElementById("audioFile").files[0];
     const formData = new FormData();
     formData.append("file", audioFile);

     fetch("/upload_audio", {
          method: "POST",
          body: formData,
     })
          .then((response) => {
               if (!response.ok) {
                    return response.json().then((error) => {
                         throw new Error(error.error);
                    });
               }
               return response.json();
          })
          .then((data) => {
               if (data.error) {
                    document.getElementById("output").innerText = data.error;
               } else {
                    document.getElementById("output").innerText = data.match_result
                         ? "The user-provided information is relevant."
                         : "The user-provided information does not match.";
                    document.getElementById("correctKeywords").innerText =
                         data.dataset_keywords.join(", ");
                    document.getElementById("matchedKeywords").innerText =
                         data.user_keywords.join(", ");
                    document.getElementById(
                         "accuracy"
                    ).innerText = `Information matched: ${data.accuracy.toFixed(2)}%`;
                    document.getElementById(
                         "userParagraph"
                    ).innerText = `Extracted Paragraph: ${data.user_paragraph}`;
               }
          })
          .catch((error) => {
               document.getElementById(
                    "output"
               ).innerText = `Error: ${error.message}`;
          });
}