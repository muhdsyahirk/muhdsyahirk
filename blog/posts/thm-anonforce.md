# TryHackMe - Anonforce (Write-Up)

_6 min read · June 18, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Anonforce**](https://tryhackme.com/room/bsidesgtanonforce) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: stuxnet

---

## Scanning for Open Ports

Machine IP: 10.48.156.194.

As usual, I started with an [**Nmap**](https://www.kali.org/tools/nmap/) scan:

```bash
nmap -T4 -p- 10.48.156.194
sudo nmap -sCV -p 21,22 10.48.156.194 -oN nmap.txt
```

```output
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-syst:
|   STAT:
| FTP server status:
|      Connected to ::ffff:192.168.157.118
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| drwxr-xr-x    2 0        0            4096 Aug 11  2019 bin
| drwxr-xr-x    3 0        0            4096 Aug 11  2019 boot
| drwxr-xr-x   17 0        0            3700 Jun 18 01:51 dev
| drwxr-xr-x   85 0        0            4096 Aug 13  2019 etc
| drwxr-xr-x    3 0        0            4096 Aug 11  2019 home
| lrwxrwxrwx    1 0        0              33 Aug 11  2019 initrd.img -> boot/initrd.img-4.4.0-157-generic
| lrwxrwxrwx    1 0        0              33 Aug 11  2019 initrd.img.old -> boot/initrd.img-4.4.0-142-generic
| drwxr-xr-x   19 0        0            4096 Aug 11  2019 lib
| drwxr-xr-x    2 0        0            4096 Aug 11  2019 lib64
| drwx------    2 0        0           16384 Aug 11  2019 lost+found
| drwxr-xr-x    4 0        0            4096 Aug 11  2019 media
| drwxr-xr-x    2 0        0            4096 Feb 26  2019 mnt
| drwxrwxrwx    2 1000     1000         4096 Aug 11  2019 notread [NSE: writeable]
| drwxr-xr-x    2 0        0            4096 Aug 11  2019 opt
| dr-xr-xr-x  102 0        0               0 Jun 18 01:51 proc
| drwx------    3 0        0            4096 Aug 11  2019 root
| drwxr-xr-x   18 0        0             540 Jun 18 01:51 run
| drwxr-xr-x    2 0        0           12288 Aug 11  2019 sbin
| drwxr-xr-x    3 0        0            4096 Aug 11  2019 srv
| dr-xr-xr-x   13 0        0               0 Jun 18 01:51 sys
|_Only 20 shown. Use --script-args ftp-anon.maxlist=-1 to see all.
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 8a:f9:48:3e:11:a1:aa:fc:b7:86:71:d0:2a:f6:24:e7 (RSA)
|   256 73:5d:de:9a:88:6e:64:7a:e1:87:ec:65:ae:11:93:e3 (ECDSA)
|_  256 56:f9:9f:24:f1:52:fc:16:b7:7b:a3:e2:4f:17:b4:ea (ED25519)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```

From the scan result, I noticed that:

- FTP (port 21) is open and anonymous login is allowed.
- SSH (port 22) is open.

---

## FTP Enumeration

I logged in to FTP as anonymous:

```bash
ftp 10.48.156.194
anonymous
```

I navigated to `home` directory and found the **user flag**.

```output
drwxr-xr-x    4 1000     1000         4096 Aug 11  2019 melodias
```

I noticed user `melodias`, which could be useful for SSH login later.

I downloaded the `user.txt`:

```bash
get user.txt
```

I exited the FTP and read its content.

```output
606083fd33beb1284fc51f411a706af8
```

That was fast.

---

## Further Enumeration on FTP

I logged back into FTP.

While browsing the directories, I found a writable directory named `notread`.

I navigated into it and listed its contents:

```bash
cd notread
ls
```

```output
-rwxrwxrwx    1 1000     1000          524 Aug 11  2019 backup.pgp
-rwxrwxrwx    1 1000     1000         3762 Aug 11  2019 private.asc
```

I then downloaded both files:

```bash
mget *
```

After doing some research, I found that PGP (Pretty Good Privacy) is an encryption system that uses public key cryptography.

The `backup.pgp` is an encrypted file, while `private.asc` is an ASCII-armored OpenPGP private key that can be used to decrypt it.

However, the private key itself is protected by a passphrase, so I needed to recover the passphrase first before I could use it.

---

## Exploitation

First, I extracted the password hash from the private key:

```bash
gpg2john private.asc > tmp
```

```output
anonforce:$gpg$*17*54*2048*e419ac715ed55197122fd0acc6477832266db83b63a3f0d16b7f5fb3db2b93a6a995013bb1e7aff697e782d505891ee260e957136577*3*254*2*9*16*5d044d82578ecc62baaa15c1bcf1cfdd*65536*d7d11d9bf6d08968:::anonforce <melodias@anonforce.nsa>::private.asc
```

This converts the private key into a format that John the Ripper can understand.

Next, I brute-forced the passphrase using [**John**](https://www.kali.org/tools/john/):

```bash
john tmp
```

```output
xbox360          (anonforce)
```

Now I have the passphrase.

Then, I imported the private key into GPG:

```bash
gpg --import private.asc
xbox360
```

```output
gpg: key B92CD1F280AD82C2: secret key imported
gpg: key B92CD1F280AD82C2: "anonforce <melodias@anonforce.nsa>" not changed
gpg: Total number processed: 2
gpg:               imported: 1
gpg:              unchanged: 1
gpg:       secret keys read: 1
gpg:   secret keys imported: 1
```

After importing the key, I decrypted `backup.pgp`:

```bash
gpg --decrypt backup.pgp
xbox360
```

```output
root:$6$07nYFaYf$F4VMaegmz7dKjsTukBLh6cP01iMmL7CiQDt1ycIm6a.bsOIBp0DwXVb9XI2EtULXJzBtaMZMNd2tV4uob5RVM0:18120:0:99999:7:::
```

I saved it into another file.

I checked the hash type:

```bash
john tmp2
```

```output
Loaded 1 password hash (sha512crypt, crypt(3) $6$ [SHA512 256/256 AVX2 4x])
```

Then I cracked it using John with the `rockyou.txt` wordlist:

```bash
john tmp2 --format=sha512crypt --wordlist=/usr/share/wordlists/rockyou.txt
```

```output
hikari           (root)
```

I successfully recovered the root password.

---

## Post-Exploitation

I logged in through SSH as root:

```bash
ssh root@10.48.156.194
hikari
```

Then I retrieved the **root flag**.

```bash
cat root.txt
```

```output
f706456440c7af4187810c31c6cebdce
```

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- enumerate anonymous FTP services
- understand the basics of PGP encryption and private key
- recover GPG private key passphrase using John
- decrypt PGP-encrypted file using imported private key
- identify and crack Linux password hash

Thank you for reading and see you next time!
