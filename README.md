# ft_transcendence

Please keep this file up-to-date with your respective current task(s) sorted by priority.

# Unassigned:

• The user should be able to invite other users to play a Pong game through the chat interface. (ChatRoom.page /chat/invite Backend Response)

- Every User Input should use dto!! Form Validation.

```
ERROR Notes, need to be debuged:
---------------------------------------------------------------------------------------------------------
[1. Error]: User ohne account: !!
Firefox kann keine Verbindung zu dem Server unter ws://localhost:8080/socket.io/?EIO=4&transport=websocket&sid=NYxhcjHul4plKnplAAAU aufbauen. websocket.js:43:26
App: Disconnected: io server disconnect App.tsx:16:11
Die Verbindung zu ws://localhost:8080/socket.io/?EIO=4&transport=websocket&sid=NYxhcjHul4plKnplAAAU wurde unterbrochen, während die Seite geladen wurde. websocket.js:43:26
---------------------------------------------------------------------------------------------------------
[2. Error]: direkt nachdem login mit intrauser!
Einige Cookies verwenden das empfohlene "SameSite"-Attribut inkorrekt. 2
Das Cookie "token" verfügt über keinen gültigen Wert für das "SameSite"-Attribut. Bald werden Cookies ohne das "SameSite"-Attribut oder mit einem ungültigen Wert dafür als "Lax" behandelt. Dadurch wird das Cookie nicht länger an Kontexte gesendet, die zu einem Drittanbieter gehören. Falls Ihre Anwendung das Cookie in diesen Kontexten benötigt, fügen Sie bitte das Attribut "SameSite=None" zu ihm hinzu. Weitere Informationen zum "SameSite"-Attribut finden Sie unter https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie/SameSite.
---------------------------------------------------------------------------------------------------------
[3. Error]: http://localhost:5173/settings !!!
Warning: Received NaN for the `value` attribute. If this is expected, cast the value to a string.
input
label
div
div
GameSettings@http://localhost:5173/src/components/Pong/GameSettings.tsx:51:44
Settings
RenderedRoute@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=e27de898:3546:7
Outlet@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=e27de898:3914:20
div
_Box<@http://localhost:5173/node_modules/.vite/deps/@mantine_core.js?v=6d897e74:4098:3
Container<@http://localhost:5173/node_modules/.vite/deps/@mantine_core.js?v=6d897e74:15541:25
Header@http://localhost:5173/src/components/Header/Header.tsx:16:22
RenderedRoute@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=e27de898:3546:7
RenderErrorBoundary@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=e27de898:3503:5
DataRoutes@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=e27de898:4649:7
Router@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=e27de898:3928:7
RouterProvider@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=e27de898:4466:7
Router
MantineThemeProvider@http://localhost:5173/node_modules/.vite/deps/@mantine_core.js?v=6d897e74:2824:30
MantineProvider@http://localhost:5173/node_modules/.vite/deps/@mantine_core.js?v=6d897e74:3165:25
App@http://localhost:5173/src/App.tsx?t=1705420966335:20:14
---------------------------------------------------------------------------------------------------------
[5. Error]:

---------------------------------------------------------------------------------------------------------

```

## jjesberg

```
- Each user should have a Match History including 1v1 games, ladder, and anything else useful. Anyone who is logged in should be able to consult it.
```

## kfergani

```
database: PostgreSQL
```

## rkedida

```
- matchmaking system
        =    database: PostgreSQL
        =    protect against SQL injections
        =    server-side validation for forms and any user input
```

## rmeuth

```
render image doesnt work in profile.
frontend: create basic webpage layout
frontend: create game (pong)
customization options
```

# Completed:

#### 1. Overview

- single-page application
- multi browser support

#### 2. Security concerns

- 2FA

#### 3. User Account

• The user should be able to access other players profiles through the chat interface.

- The user should be able to choose a unique name that will be displayed on the website.
- The user should be able to add other users as friends and see their current status (online, offline, in a game, and so forth).
- upload avatar else default one must be set (intra pic)
- Stats (such as: wins and losses, ladder level, achievements, and so forth) have to be displayed on the user profile.

#### 4. Chat

- The user should be able to block other users. This way, they will see no more messages from the account they blocked.
- Chat between friends (The user should be able to send direct messages to other users.)
- Allow all users to leave the ChatRoom, if the ChatRoom owner decides to leave his CHatroom the Room gets deleted and all references (messages[] && users[]).
- The user should be able to create channels (chat rooms) that can be either public, or private, or protected by a password.
  ◦ The channel owner is a channel administrator. They can set other users as administrators.
- The user who has created a new channel is automatically set as the channel owner until they leave it.
  ◦ The channel owner can set a password required to access the channel, change it, and also remove it.
  ◦ A user who is an administrator of a channel can kick, ban or mute (for a limited time) other users, but not the channel owners.

#### 5. Game
