# Android RPYC dialogue extraction patch

This directory contains the tested Android build that fixes English dialogue
extraction from Ren'Py RPC2 `.rpyc` files.

## Fixes

- Reads RPC2 pickle strings without discarding dialogue during native filtering.
- Ignores unsafe `BINBYTES`/`BINSTRING` false positives in protocol-2 payloads.
- Advances one byte after an invalid four-byte string candidate instead of
  trusting a bogus length and jumping to the end of the file.
- Keeps dialogue classification in the JavaScript layer.

## Verification

The patch was tested against `x-chapter1.rpyc` from the connected Android game:

- Before: 0-2 extracted strings.
- After: 273 extracted strings.
- The resulting samples contain continuous English dialogue.

Install `slg-translator-android-rpyc-v12.apk` over the existing Android app.
The APK is signed with the Android debug key used by this development build.

`patch_rpyc_dialogue.py` documents and applies the DEX-level changes to the
matching `classes6.dex`. It validates every original byte sequence before
writing and refreshes the DEX SHA-1 signature and Adler-32 checksum.
