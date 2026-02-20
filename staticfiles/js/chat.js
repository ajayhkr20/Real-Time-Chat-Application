// chat.js
const container = document.getElementById("chat-container");
const roomName = container.dataset.room;
const sender = Number(container.dataset.sender);
const receiver = Number(container.dataset.receiver);

const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(protocol + window.location.host + "/ws/chat/" + roomName + "/");

socket.onmessage = function(e){
    const data = JSON.parse(e.data);
    const chatBox = document.getElementById("chat-box");

    let messageClass = data.sender_id === sender ? "sent" : "received";
    let ticks = data.sender_id === sender ? '<span class="tick">✓</span>' : '';

    chatBox.innerHTML += `
        <div class="message ${messageClass}" data-id="${data.msg_id}">
            <b>${data.sender_name}</b><br>
            ${data.message}
            ${ticks}
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
};

function sendMessage(){
    const input = document.getElementById("message-input");
    if(input.value.trim() === "") return;

    socket.send(JSON.stringify({
        message: input.value,
        sender: sender,
        receiver: receiver
    }));
    input.value = "";
}

document.getElementById("message-input")
.addEventListener("keypress", function(e){
    if(e.key === "Enter") sendMessage();
});

function deleteMessage(msgId, btn){
    fetch(`/delete_message/${msgId}/`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success'){
            const messageDiv = btn.closest('.message');
            messageDiv.remove();
        } else alert("Failed to delete message.");
    })
    .catch(err => console.log(err));
}

window.onload = function(){
    const chatBox = document.getElementById("chat-box");
    chatBox.scrollTop = chatBox.scrollHeight;
};


socket.onmessage = function(e){
    const data = JSON.parse(e.data);
    const chatBox = document.getElementById("chat-box");

    let messageClass = data.sender_id === sender ? "sent" : "received";
    let ticks = data.sender_id === sender ? '<span class="tick">✓</span>' : '';

    let deleteBtn = '';
    if (data.sender_id === sender) {
        deleteBtn = `<button class="btn btn-sm btn-danger btn-delete" onclick="deleteMessage(${data.msg_id}, this)">
                        <i class="fas fa-trash"></i>
                     </button>`;
    }

    chatBox.innerHTML += `
        <div class="message ${messageClass}" data-id="${data.msg_id}">
            <b>${data.sender_name}</b><br>
            ${data.message}
            ${ticks}
            ${deleteBtn}
        </div>
    `;

    chatBox.scrollTop = chatBox.scrollHeight;
};
