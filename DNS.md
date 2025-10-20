EMAIL CONFIGURATION
DKIM and SPF (Enable email signing and specify authorized senders.)
Type: MX
Name: alerts
priority: 10
Value: feedback-smtp.us-east-1.amazonses.com
TTL: Auto

Type: TXT
Name: alerts
Value: v=spf1 include:amazonses.com ~all
TTL: Auto

Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAiD4HYLN3wlRnWDeAz0RAnVm2jYV1MtYj/RacR0yrpr6LPKazm82SdarT3l0tCPj8Jk0LKlohruOOUwNFZ1QxPEc3fPvwJVJCuSp4GO/3ItzcRMhKK1y/EzQbudeR6b2S+/mmHOINGFPaMqAjsgwpg9tAmydnq6MRd5STvzQ95wIDAQAB
TTL: Auto

DMARC (Set authentication policies and receive reports.)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
TTL: Auto

Vercel
Type: CNAME
Name: h4i
Value: b4c69a77e3fe6efe.vercel-dns-017.com

Nameservers:
ns1.vercel-dns.com
ns2.vercel-dns.com