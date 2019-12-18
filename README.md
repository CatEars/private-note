# Private Note

[![CircleCI](https://circleci.com/gh/CatEars/private-note.svg?style=svg)](https://circleci.com/gh/CatEars/private-note)
[![](https://images.microbadger.com/badges/image/catears/private-note.svg)](https://microbadger.com/images/catears/private-note 'Get your own image badge on microbadger.com')
[![](https://images.microbadger.com/badges/version/catears/private-note.svg)](https://microbadger.com/images/catears/private-note 'Get your own version badge on microbadger.com')

A simple and free application that uses basic end to end encryption to share
secrets. Once read, the secrets are destroyed.

#### Try it out with docker

```
docker run -p 3000:3000 catears/private-note
```

and visit [http://localhost:3000](http://localhost:3000).

## Security

A user, the writer, wants to create a note. When the user has written the
message and entered the time to live for the note, the page will do the
following:

The page will generate a a random IV using
[Crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
and generate a key using
[SubtleCrypto.generateKey()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey).

The note will be encrypted, using AES-GCM, with the generated key and the IV
with the help of
[SubtleCrypto.encrypt()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt).

Additionally, the page will also generate a fingerprint of the original message,
with SHA-512, using
[SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest).

The page will then send the encrypted message, the IV, the fingerprint and the
time to live for the note to the server, where it will be stored. The server
will reply with a unique ID (uuid v4). The page will then create and show a link
with the uuid and a urlencoded key. The key is part of the fragment of the url,
which is never sent to the server.

At this point the user will send the link to the receiver over the appropriate
channels. The receiver will go to the link and the server will send the
encrypted secret, the salt, the fingerprint and the IV to the receiver. The
server will redirect to an error page if the note has already been accessed more
times than allowed. Otherwise, the page will automatically decode the key, that
is part of the URL, and use it to decrypt the encrypted message. If the
fingerprint of the decrypted text is equal to the fingerprint sent from the
server the receiver will be able to view it in a textfield and copy the it to
their clipboard. If the fingerprint is not equal to the expected value, an error
message will be shown.

## Development

First time?

```bash
$ cd frontend && npm i && npm run bootstrap && cd ../backend && npm i
```

Start frontend in one terminal:

```bash
$ cd frontend && npm start
```

Start backend in another terminal/tab:

```bash
$ cd backend && npm start
```

and then head to `http://localhost:3000/`.
