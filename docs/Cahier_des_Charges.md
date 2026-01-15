# **Cahier des Charges – NearMeet (Vue.js + Python)**
**Version :** 1.0
**Date :** 15 janvier 2026
**Projet :** Application de communication locale multi-fonctions
**Technologies :** Vue.js 3 (frontend), Python (FastAPI/Flask + WebSockets), WebRTC (via JavaScript)

---

## **1. Introduction**
### **1.1 Contexte**
NearMeet est une application de communication locale permettant aux utilisateurs de discuter en temps réel, partager des fichiers, passer des appels vidéo/audio, et collaborer via un réseau local (LAN). Le backend sera développé en **Python** pour la gestion des connexions, des WebSockets, et des APIs, tandis que le frontend utilisera **Vue.js** pour une interface réactive.

### **1.2 Objectifs**
- Créer une interface utilisateur moderne avec **Vue.js**.
- Développer un backend robuste en **Python** (FastAPI ou Flask) pour gérer les WebSockets, les APIs REST, et la signalisation WebRTC.
- Intégrer des fonctionnalités avancées (appels vidéo/audio, partage d’écran) avec **WebRTC** (côté frontend).
- Garantir la sécurité et la confidentialité des échanges.
- Rendre l’application compatible avec les navigateurs modernes.

### **1.3 Public Cible**
- **Entreprises** : Pour les réunions internes et le partage de documents.
- **Écoles/Universités** : Pour les cours en ligne ou les projets collaboratifs.
- **Communautés locales** : Pour les échanges entre voisins ou associations.
- **Développeurs** : Pour les tests en environnement local ou les démonstrations techniques.

---

## **2. Spécifications Fonctionnelles**
### **2.1 Fonctionnalités Principales**
| **Fonctionnalité**          | **Description**                                                                                     | **Priorité** |
|------------------------------|-----------------------------------------------------------------------------------------------------|--------------|
| **Connexion locale**         | Communication via WebSocket sur un réseau local (LAN).                                               | Haute        |
| **Pseudonymes**              | Chaque utilisateur choisit un pseudo pour s’identifier.                                             | Haute        |
| **Historique des messages**  | Sauvegarde des messages dans une base de données locale (SQLite).                                   | Haute        |
| **Notifications**            | Alertes sonores et visuelles pour les nouveaux messages/appels.                                     | Moyenne      |
| **Partage de fichiers**      | Envoi de fichiers (PDF, images, documents) via le backend Python.                                    | Haute        |
| **Appels vidéo/audio**       | Communication en temps réel (1:1 ou en groupe) avec WebRTC (frontend) + signalisation Python.      | Haute        |
| **Partage d’écran**          | Diffusion de l’écran d’un utilisateur aux autres participants (WebRTC).                              | Moyenne      |
| **Messages audio**           | Enregistrement et envoi de messages vocaux (frontend).                                              | Moyenne      |
| **Appels de groupe (Meet)**  | Créer des salles de discussion vidéo/audio pour plusieurs utilisateurs.                              | Basse        |
| **Salons de discussion**     | Créer des canaux thématiques (ex : "Travail", "Loisirs").                                           | Basse        |
| **Chiffrement**              | Chiffrement des messages pour garantir la confidentialité (AES, via Python).                        | Moyenne      |

---

## **3. Spécifications Techniques**
### **3.1 Frontend (Vue.js)**
- **Framework** : Vue.js 3 (Composition API).
- **State Management** : Pinia pour gérer l’état global (utilisateurs, messages, appels).
- **Router** : Vue Router pour la navigation entre les vues.
- **UI Components** : Quasar ou Vuetify pour des composants prêts à l’emploi.
- **WebRTC** : Intégration directe dans le navigateur pour les appels vidéo/audio et le partage d’écran.
- **Notifications** : API Notification du navigateur + `howler.js` pour les sons.

### **3.2 Backend (Python)**
- **Framework** : FastAPI (recommandé pour sa rapidité et sa compatibilité avec WebSockets) ou Flask.
- **WebSockets** : `websockets` (pour FastAPI) ou `Flask-SocketIO` pour la communication temps réel.
- **Signalisation WebRTC** : Le backend Python gère la signalisation (échange de SDP et candidates) entre les pairs.
- **Stockage** :
  - **Messages** : Base de données SQLite (intégrée à Python).
  - **Fichiers partagés** : Stockage temporaire sur le serveur ou en P2P.
- **Sécurité** : Chiffrement des messages avec `cryptography` (Python).

### **3.3 Communication Réseau**
- **WebSockets** : Pour le chat et les notifications (gérés par Python).
- **WebRTC** : Pour les appels vidéo/audio et le partage d’écran (gérés par le frontend Vue.js).
- **Découverte locale** : Utilisation de `zeroconf` ou `multicast` pour détecter les utilisateurs sur le même réseau.

---

## **4. Architecture du Projet**
### **4.1 Structure des Dossiers**
```plaintext
nearmeet/
├── client/               # Frontend (Vue.js)
│   ├── public/
│   ├── src/
│   │   ├── components/   # Chat.vue, VideoCall.vue, etc.
│   │   ├── stores/       # Pinia stores
│   │   ├── router/       # Vue Router
│   │   ├── App.vue
│   │   └── main.js
│   └── package.json
├── server/               # Backend (Python)
│   ├── app/              # Code source Python
│   │   ├── main.py       # Point d'entrée FastAPI/Flask
│   │   ├── websockets/   # Gestion des WebSockets
│   │   ├── models/       # Modèles de données
│   │   ├── schemas/      # Schémas Pydantic (si FastAPI)
│   │   └── static/       # Fichiers statiques
│   ├── requirements.txt  # Dépendances Python
│   └── Dockerfile        # Optionnel, pour le déploiement
└── README.md
```

### **4.2 Schéma de Communication
```
Frontend (Vue.js)
       ↓ (WebSocket) → Backend (Python) ← (WebSocket) ↓
       ↓ (WebRTC) ←→ (WebRTC) ↓
Utilisateur A ↔ Utilisateur B
```

---

## **5. Maquettes et Interface Utilisateur**
### **5.1 Fenêtre Principale (Vue.js)**
- **Zone de discussion** : Affichage des messages (texte, audio, fichiers).
- **Liste des utilisateurs** : Pseudos et statuts (en ligne/absent).
- **Boutons d’action** :
  - Lancer un appel vidéo/audio.
  - Partager un fichier.
  - Partager son écran.

### **5.2 Fenêtre d’Appel Vidéo (Vue.js + WebRTC)**
- **Affichage vidéo** : Webcam locale et distante.
- **Contrôles** :
  - Activer/désactiver le microphone et la caméra.
  - Partager son écran.
  - Quitter l’appel.

---
*(Je peux générer des maquettes visuelles si besoin !)*

---

## **6. Planification et Livrables**
### **6.1 Phases du Projet**
| **Phase**               | **Durée estimée** | **Livrables**                                                                 |
|-------------------------|-------------------|-------------------------------------------------------------------------------|
| **Conception**          | 1 semaine         | Cahier des charges, maquettes, architecture technique.                       |
| **Backend Python**      | 2 semaines        | API REST + WebSockets fonctionnels (FastAPI/Flask).                          |
| **Frontend Vue.js**     | 2 semaines        | Interface graphique réactive (chat, appels).                                 |
| **Chat texte**          | 1 semaine         | Échange de messages via WebSocket.                                           |
| **Appels vidéo/audio**  | 2 semaines        | Intégration de WebRTC + signalisation Python.                               |
| **Partage d’écran**     | 1 semaine         | Capture et diffusion de l’écran via WebRTC.                                  |
| **Tests et corrections**| 1 semaine         | Correction des bugs, optimisation.                                           |
| **Documentation**       | 3 jours           | Guide utilisateur, documentation technique.                                |

### **6.2 Livrables Finaux**
- **Application web** : Frontend Vue.js + Backend Python.
- **Code source** : Disponible sur GitHub (frontend + backend).
- **Documentation** :
  - Guide d’installation et de déploiement.
  - Manuel utilisateur.
  - Documentation technique (API, WebSockets, WebRTC).

---

## **7. Défis et Solutions**
| **Défi**                          | **Solution**                                                                 |
|-----------------------------------|-----------------------------------------------------------------------------|
| **Signalisation WebRTC**          | Utiliser le backend Python pour échanger les offres/réponses WebRTC.       |
| **Latence dans les appels**       | Optimiser la communication P2P avec WebRTC.                                |
| **Partage d’écran bloqué**        | Vérifier les permissions navigateur (`getDisplayMedia`).                    |
| **Gestion des rooms**             | Implémenter des salons avec `socket.io` ou des canaux WebSocket.           |
| **Sécurité**                      | Chiffrer les messages avec `cryptography` (Python).                        |

---

## **8. Outils et Bibliothèques**
| **Besoin**               | **Outil/Bibliothèque (Frontend)** | **Outil/Bibliothèque (Backend)**          | **Lien**                                  |
|--------------------------|-----------------------------------|-------------------------------------------|-------------------------------------------|
| **Framework frontend**    | Vue.js 3                          | -                                         | [vuejs.org](https://vuejs.org/)           |
| **State Management**     | Pinia                              | -                                         | [pinia.vuejs.org](https://pinia.vuejs.org)|
| **WebSockets**           | Socket.io (client)                | `websockets` (FastAPI) ou `Flask-SocketIO`| [websockets](https://websockets.readthedocs.io/) |
| **WebRTC**               | `simple-peer`                     | -                                         | [simple-peer](https://github.com/feross/simple-peer) |
| **Appels vidéo**         | API `getUserMedia`                | -                                         | [MDN WebRTC](https://developer.mozilla.org/fr/docs/Web/API/WebRTC_API) |
| **Partage d’écran**      | `getDisplayMedia`                 | -                                         | [MDN getDisplayMedia](https://developer.mozilla.org/fr/docs/Web/API/Screen_Capture_API) |
| **Base de données**      | -                                 | SQLite (via `sqlite3`)                   | [sqlite.org](https://www.sqlite.org/)     |
| **Chiffrement**          | -                                 | `cryptography`                           | [cryptography](https://cryptography.io/) |

---

## **9. Exemple de Code**
### **a. Backend Python (FastAPI + WebSockets)**
```python
# server/app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from websockets.exceptions import ConnectionClosedOK

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# Gestion des connexions WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client {client_id}: {data}")
    except (WebSocketDisconnect, ConnectionClosedOK):
        manager.disconnect(websocket)
        await manager.broadcast(f"Client {client_id} a quitté la discussion.")
```

### **b. Frontend Vue.js (Chat + WebSocket)**
```vue
<!-- src/components/Chat.vue -->
<template>
  <div class="chat">
    <div v-for="msg in messages" :key="msg.id" class="message">
      {{ msg.user }}: {{ msg.text }}
    </div>
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Écrivez un message..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';

const chatStore = useChatStore();
const messages = ref(chatStore.messages);
const newMessage = ref('');

const socket = new WebSocket('ws://localhost:8000/ws/1');

socket.onmessage = (event) => {
  chatStore.addMessage(JSON.parse(event.data));
};

const sendMessage = () => {
  if (newMessage.value.trim()) {
    socket.send(JSON.stringify({
      user: chatStore.user,
      text: newMessage.value,
    }));
    newMessage.value = '';
  }
};
</script>
```

### **c. Appel Vidéo avec WebRTC (Vue.js)**
```vue
<!-- src/components/VideoCall.vue -->
<template>
  <div>
    <video ref="localVideo" autoplay muted></video>
    <video ref="remoteVideo" autoplay></video>
    <button @click="startCall">Démarrer l'appel</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Peer from 'simple-peer';

const localVideo = ref(null);
const remoteVideo = ref(null);
let peer = null;
const socket = new WebSocket('ws://localhost:8000/ws/1');

const startCall = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.value.srcObject = stream;

  peer = new Peer({ initiator: true, stream, trickle: false });
  peer.on('signal', (data) => {
    socket.send(JSON.stringify({ type: 'signal', data }));
  });

  peer.on('stream', (remoteStream) => {
    remoteVideo.value.srcObject = remoteStream;
  });
};

socket.onmessage = async (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'signal') {
    peer.signal(message.data);
  }
};
</script>
```

---

## **10. Conclusion**
Ce cahier des charges détaille la réalisation de **NearMeet** avec :
- **Vue.js** pour le frontend (interface réactive).
- **Python (FastAPI/Flask)** pour le backend (WebSockets, signalisation WebRTC, gestion des fichiers).
- **WebRTC** pour les appels vidéo/audio et le partage d’écran (côté frontend).
