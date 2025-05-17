document.addEventListener("DOMContentLoaded", function () {
  // Éléments DOM
  const jsEditor = document.getElementById("js-editor");
  const jsonEditor = document.getElementById("json-editor");
  const strEditor = document.getElementById("str-editor");

  const jsStatus = document.getElementById("js-status");
  const jsonStatus = document.getElementById("json-status");
  const strStatus = document.getElementById("str-status");

  const jsUpdateBtn = document.getElementById("js-update");
  const jsonUpdateBtn = document.getElementById("json-update");
  const strUpdateBtn = document.getElementById("str-update");

  const jsCopyBtn = document.getElementById("js-copy");
  const jsonCopyBtn = document.getElementById("json-copy");
  const strCopyBtn = document.getElementById("str-copy");

  const jsCopyFeedback = document.getElementById("js-copy-feedback");
  const jsonCopyFeedback = document.getElementById("json-copy-feedback");
  const strCopyFeedback = document.getElementById("str-copy-feedback");

  const autoUpdateCheckbox = document.getElementById("auto-update");

  // Fonctions utilitaires
  function updateStatus(element, message, isError = false) {
    element.textContent = message;
    element.className = "status";
    if (isError) {
      element.classList.add("error");
    } else if (message) {
      element.classList.add("success");
    }

    // Effacer après 3 secondes
    setTimeout(() => {
      element.textContent = "";
      element.className = "status";
    }, 3000);
  }

  function showCopyFeedback(element) {
    element.classList.add("show");
    setTimeout(() => {
      element.classList.remove("show");
    }, 2000);
  }

  // Fonction de conversion du JS vers JSON
  function jsToJson() {
    try {
      const jsCode = jsEditor.value;

      // On vérifie si le code contient une déclaration
      const match = jsCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*/);
      if (match) {
        // On extrait le nom de variable et on l'ajoute à une fonction eval sécurisée
        const varName = match[1];
        const jsObject = new Function(`
                            ${jsCode}
                            return ${varName};
                        `)();

        // Conversion en JSON formaté
        const jsonFormatted = JSON.stringify(jsObject, null, 4);
        jsonEditor.value = jsonFormatted;

        // Conversion en JSON stringifié (compact, sans indentation ni retours à la ligne)
        strEditor.value = JSON.stringify(JSON.stringify(jsObject));

        updateStatus(jsStatus, "Conversion réussie", false);
        return true;
      } else {
        // Si pas de déclaration, on essaie de parser en supposant que c'est un objet direct
        const jsObject = new Function(`
                            return ${jsCode};
                        `)();

        // Conversion en JSON formaté
        const jsonFormatted = JSON.stringify(jsObject, null, 4);
        jsonEditor.value = jsonFormatted;

        // Conversion en JSON stringifié (compact)
        strEditor.value = JSON.stringify(JSON.stringify(jsObject));

        updateStatus(jsStatus, "Conversion réussie", false);
        return true;
      }
    } catch (error) {
      updateStatus(jsStatus, `Erreur: ${error.message}`, true);
      return false;
    }
  }

  // Fonction de conversion du JSON standard vers les autres formats
  function jsonToOthers() {
    try {
      // Parse le JSON
      const jsonObject = JSON.parse(jsonEditor.value);

      // Génère le code JS
      let jsCode = "const data = " + JSON.stringify(jsonObject, null, 4) + ";";
      // Remplace les quotes par des doubles quotes pour le style
      jsCode = jsCode.replace(/"([^"]+)":/g, "$1:");
      jsEditor.value = jsCode;

      // Génère le JSON stringifié (compact)
      strEditor.value = JSON.stringify(JSON.stringify(jsonObject));

      updateStatus(jsonStatus, "Conversion réussie", false);
      return true;
    } catch (error) {
      updateStatus(jsonStatus, `Erreur: ${error.message}`, true);
      return false;
    }
  }

  // Fonction de conversion du JSON stringifié vers les autres formats
  function strToOthers() {
    try {
      // Parse la chaîne stringifiée pour obtenir le JSON
      const jsonString = JSON.parse(strEditor.value);

      try {
        // Parse le JSON contenu dans la chaîne
        const jsonObject = JSON.parse(jsonString);

        // Mettre à jour l'éditeur JSON avec le format pretty
        jsonEditor.value = JSON.stringify(jsonObject, null, 4);

        // Génère le code JS
        let jsCode =
          "const data = " + JSON.stringify(jsonObject, null, 4) + ";";
        // Remplace les quotes par des doubles quotes pour le style
        jsCode = jsCode.replace(/"([^"]+)":/g, "$1:");
        jsEditor.value = jsCode;

        updateStatus(strStatus, "Conversion réussie", false);
        return true;
      } catch (jsonError) {
        // Si le JSON est une simple chaîne et non un objet
        jsonEditor.value = jsonString;
        jsEditor.value = `const data = ${jsonString};`;

        updateStatus(strStatus, "Conversion réussie (chaîne simple)", false);
        return true;
      }
    } catch (error) {
      updateStatus(strStatus, `Erreur: ${error.message}`, true);
      return false;
    }
  }

  // Fonctions de copie
  function copyToClipboard(text, feedbackElement) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showCopyFeedback(feedbackElement);
      })
      .catch((err) => {
        console.error("Erreur lors de la copie :", err);
      });
  }

  // Événements de mise à jour
  jsUpdateBtn.addEventListener("click", jsToJson);
  jsonUpdateBtn.addEventListener("click", jsonToOthers);
  strUpdateBtn.addEventListener("click", strToOthers);

  // Événements de copie
  jsCopyBtn.addEventListener("click", () =>
    copyToClipboard(jsEditor.value, jsCopyFeedback)
  );
  jsonCopyBtn.addEventListener("click", () =>
    copyToClipboard(jsonEditor.value, jsonCopyFeedback)
  );
  strCopyBtn.addEventListener("click", () =>
    copyToClipboard(strEditor.value, strCopyFeedback)
  );

  // Mise à jour automatique
  let autoUpdateTimeout;

  function setupAutoUpdate(editor, updateFn) {
    editor.addEventListener("input", function () {
      if (autoUpdateCheckbox.checked) {
        clearTimeout(autoUpdateTimeout);
        autoUpdateTimeout = setTimeout(() => {
          updateFn();
        }, 1000); // Délai de 1s pour éviter trop de mises à jour pendant la frappe
      }
    });
  }

  setupAutoUpdate(jsEditor, jsToJson);
  setupAutoUpdate(jsonEditor, jsonToOthers);
  setupAutoUpdate(strEditor, strToOthers);

  // Initialiser l'application avec les données d'exemple
  jsToJson();
});
