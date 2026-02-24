# TryHackMe - RootMe (Write-Up)

_4 min read · February 26, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Basic Pentesting**](https://tryhackme.com/room/basicpentestingjt) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Become Root
- Difficulty: Easy
- Machine Author: ReddyyZ

---

## Scanning for Open Ports

The machine IP address in my case is **10.49.168.47**.

Again as usual:

```bash
nmap 10.49.168.47
sudo nmap -sCV -p 22,80,139,445 10.49.168.47
```

![Nmap Output](./img/thm-basicpentesting/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.
- NetBIOS-SSN (port 139 and 445) is open.

As usual, I browsed the site first.

![Basic Pentest: Website](./img/thm-basicpentesting/web.png)

I inspected the source code and I found a comment:

```html
<!-- Check our dev note section if you need to know what to work on. -->
```

---

## Futher Enumeration on the Website

I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the site.

```bash
gobuster dir -u http://10.49.168.47 -w /usr/share/wordlists/dirb/common.txt
```

![Gobuster Output](./img/thm-basicpentesting/gobuster-output.png)

Then I accessed the `development`.
