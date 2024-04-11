
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import * as monaco from 'monaco-editor'
import { useState, useRef, useEffect } from 'react'
import Editor from "@monaco-editor/react"
import * as Y from "yjs"
import { WebrtcProvider } from 'y-webrtc'
import { MonacoBinding } from "y-monaco"
import io from 'socket.io-client';
import Client from '../component/client';
import toast from 'react-hot-toast'
const API_BASE_URL=import.meta.env.VITE_BASE_URL




function MyEditor() {
  
  const { roomId } = useParams();
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const username = query.get('username');
  const reactNavigator = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [clients, setClients] = useState([]); //Storing user data

  const editorRef = useRef(null);
  
  //Generate random color each user
  const generateRandomColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  };

  //css style cursor for each user 
  function generateCursorStyles(awarenessUsers) {
    let cursorStyles = '';
    for (const [clientId, client] of awarenessUsers) {
      if (client?.user) {
        cursorStyles += `
          .yRemoteSelection-${clientId}{
            background-color:${client.user.color};
          }
          .yRemoteSelectionHead-${clientId} {
            color: ${client.user.color};
          }
          .yRemoteSelectionHead-${clientId}::after {
            content: "${client.user.name}";
            position: absolute;
            top: -30px;
            left: 0;
            font-size: 12px;
            color: black;
            background-color:${client.user.color};
            padding: 2px 4px;
            border-radius: 1px;
          }
        `;
      }
    }
    return cursorStyles;
  }
  
  //On Monaco Editor Mount
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    const doc = new Y.Doc();
    const provider=new WebrtcProvider(roomId,doc)
    const awareness=provider.awareness
    awareness.setLocalStateField("user", {
      name:username,
      color:generateRandomColor()
    });
    const type = doc.getText('monaco');
    const decorations = {};

    editorRef.current.deltaDecorations([],Object.values(decorations));

   awareness.on('change', changes => {
    // Update CSS styles when awareness state changes
      const cursorStyles = generateCursorStyles(awareness.getStates());
      const styleElement = document.createElement('style');
      styleElement.innerHTML = cursorStyles;
      document.head.appendChild(styleElement);
    });
    
    const binding = new MonacoBinding(type, (editor.getModel()), new Set([editor]),awareness);
  }

  const handleConnectedUsers = (users) => {
    // console.log(`Updated list of connected users: ${users}`);
    setClients(users);
  };

  useEffect(()=>{
    //socket intialization
    const socketInstance = io(API_BASE_URL);
    setSocket(socketInstance)
    
    //On socket connect
    socketInstance.on('connect', () => {
      console.log("Socket connected, joining room with ID:", roomId);
      socketInstance.emit('join-room', { roomId, username });
    });
    //on user join
    socketInstance.on('user-joined', (username) => {
      if(typeof socket === 'undefined') return;
      
      setClients(prev => [...prev, username]);
      // console.log(clients)
      console.log('new user joined')
      toast.success(`${username} has joined the room.`);
      socketInstance.emit('connected-users', clients); //Emit User Array 
    });
    
    //list of updated connected users
    socketInstance.on('connected-users', handleConnectedUsers); 

    //On user-leave
    socketInstance.on('user-left', (username) => {
      //remove user from the list
      setClients(prev => prev.filter(user => user.username !== username))
      toast.success(`${username} has left the room.`);
      socketInstance.emit('connected-users', clients);
    });
    //User back online
    socketInstance.on('useronline',(user)=>{
      toast(`${user?.username} is Online !`);
    })
    //User goes offline
    socketInstance.on('useroffline', (user) => {
      toast(`${user?.username} is Offline !`);
      console.log('user disconnected')
    });


    return () => {
      socketInstance.off('user-joined');
      socketInstance.off('connected-users');
      socketInstance.off('user-left');
      socketInstance.disconnect();
      console.log("Cleaned up on component unmount");
    };


  },[roomId,username])

  
  const leaveRoom = () => {
    if(!socket) return;
    socket.emit('leave-room', { roomId, username });
    reactNavigator('/');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!');
  };

  


  return (
    <div className="mainWrap">
      <div className="aside">
          <div className="asideInner">
              <div>
                  <h1 style={{marginBottom:'0'}}>Collab</h1>
                  <span>Editor</span> 
                  
              </div>
              <h3>Connected</h3>
              <div className="clientsList">
                  {clients.map((client, index) => (
                      <Client
                          key={index}
                          username={client}
                          isCurrentUser={client?.username === username}
                      />
                  ))}
              </div>
          </div>
          <button className="btn copyBtn" onClick={copyRoomId}>
              Copy ROOM ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
              Leave
          </button>
      </div>
      <div className="editorWrap">
          <div className="editor-container" style={{ height: '100%',width:'100%',paddingTop:'5vh'}}> {/* Ensure the editor container is visible and has a height */}
          <Editor
          height='95vh'
            theme="vs-dark"
            onMount={handleEditorDidMount}
          />
          </div>
      </div>
    </div>
   
  )
}

export default MyEditor

