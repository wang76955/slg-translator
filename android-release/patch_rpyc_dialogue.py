#!/usr/bin/env python3
import argparse
import hashlib
from pathlib import Path
import zlib


PATCHES = {
    # Start from the second RPC2 record, where the AST/dialogue payload lives.
    0xA0D2: ("6200210021000102", "13000a00d802000c"),
    # Treat unsafe protocol-3 byte-string candidates as ordinary bytes.
    0xA628: ("a5000000", "03000000"),
    0xA630: ("a5000000", "03000000"),
    # Invalid X/T candidates advance one byte instead of using a bogus length.
    0xA5C6: ("38040800", "38041100"),
    # Restore the parser's one-million-byte string ceiling.
    0xA1EA: ("140100200000", "140140420f00"),
    # Add decoded pickle strings directly; classify dialogue in JavaScript.
    0xA4B4: ("7030f3000602", "6e2058012000"),
    0xA504: ("7030f3000502", "6e2058012000"),
    0xA58C: ("7030f3000803", "6e2058013000"),
    0xA5D0: ("7030f3000604", "6e2058014000"),
}


def patch_dex(path: Path) -> None:
    data = bytearray(path.read_bytes())

    for offset, (old_hex, new_hex) in PATCHES.items():
        old = bytes.fromhex(old_hex)
        new = bytes.fromhex(new_hex)
        actual = bytes(data[offset : offset + len(old)])
        if actual == new:
            continue
        if actual != old:
            raise RuntimeError(
                f"Unexpected bytes at 0x{offset:x}: {actual.hex()} "
                f"(expected {old.hex()})"
            )
        data[offset : offset + len(old)] = new

    data[12:32] = hashlib.sha1(data[32:]).digest()
    data[8:12] = (zlib.adler32(data[12:]) & 0xFFFFFFFF).to_bytes(4, "little")
    path.write_bytes(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Patch SLG Translator RPYC extraction")
    parser.add_argument("dex", type=Path, help="Path to the matching classes6.dex")
    args = parser.parse_args()
    patch_dex(args.dex)
    print(f"Patched {args.dex}")


if __name__ == "__main__":
    main()
