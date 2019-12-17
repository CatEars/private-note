# Private Note

[![CircleCI](https://circleci.com/gh/CatEars/private-note.svg?style=svg)](https://circleci.com/gh/CatEars/private-note)
[![](https://images.microbadger.com/badges/image/catears/private-note.svg)](https://microbadger.com/images/catears/private-note 'Get your own image badge on microbadger.com')
[![](https://images.microbadger.com/badges/version/catears/private-note.svg)](https://microbadger.com/images/catears/private-note 'Get your own version badge on microbadger.com')

A simple and free application that uses basic end to end encryption to share
secrets. Once read, the secrets are destroyed.

## Security

All notes are encrypted with a password when sent to the private-note server.
The encryption mechanism uses
[Crypto.subtle](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle)
to derive a key from the password.

The flow looks like this:

A user, the writer, wants to create a note. The landing page will generate a
random salt and a random iv using
[Crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues).
The user will enter a password and the landing page will derive an encryption
key from the password and the salt using
[SubtleCrypto.deriveKey()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey)
with PBKDF2. When the user submits the secret note, the page will encrypt the
note using the derived key, the randomly generated iv and
[SubtleCrypto.encrypt()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
in AES-GCM mode. The page will also generate a fingerprint/digest from the
original text using
[SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
with SHA-512. The page will then send the encrypted text, the salt, the iv, a
fingerprint of the original text, the time to live for the note, the number of
reads allowed before burned and any other miscellaneous information as a POST
request to the server. The server will create a note in the database and send
back a uuid (v4), that uuid is then used to build the URL where the note can be
accessed and is shown to the user.

At this point the user will send the link and the password to the receiver over
the appropriate channels. The receiver will go to the link and the server will
send the encrypted secret, the salt, the fingerprint and the iv to the receiver.
The server will redirect to an error page if the note has already been accessed
more times than allowed. The receiver then gets the option to enter the
password. The password then goes through the same process as when the writer
encrypted the original text. If the fingerprint of the decrypted text is equal
to the fingerprint sent from the server the receiver will be able to copy the
secret to their clipboard, or view it in a textfield.

## Development

First time?

```bash
$ cd frontend && npm i && npm run bootstrap && cd ../backend && npm i
```

Frontend:

```bash
$ cd frontend && npm start
```

Backend:

```bash
$ cd backend && npm start
```

# Future Ideas

### Check that WebAPI features are available in user browser
