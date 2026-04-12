import csv
import json
from pathlib import Path

source = Path(r'C:\Users\olire\Documents\workspace_python\FloLabs_Hermes\all-contacts.csv')
out = Path(r'C:\Users\olire\Documents\workspace_python\hephaestus-international\hubspot-import-preview.json')

stage_map = {
    'Lead': 'new',
    'Contacted': 'contacted',
    'Interested': 'interested_review',
    'Before Meeting': 'before_meeting',
    'Saturday meeting': 'saturday_meeting',
    'Attended': 'attended',
    'Agreement sent': 'agreement_sent',
    'Signed Non paid': 'agreement_signed',
    'Signed Paid': 'agreement_signed',
}

rows = []
with source.open('r', encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        email = (row.get('Email') or '').strip().lower()
        if not email:
            continue
        first_name = (row.get('First Name') or '').strip()
        last_name = (row.get('Last Name') or '').strip()
        full_name = (row.get('First and Last Name') or '').strip()
        if not first_name and full_name:
            parts = full_name.split()
            first_name = parts[0]
            last_name = ' '.join(parts[1:])
        lifecycle = (row.get('Status Flomad') or row.get('Status') or row.get('Lifecycle Stage') or '').strip()
        stage = stage_map.get(lifecycle, 'new')
        rows.append({
            'recordId': row.get('Record ID'),
            'email': email,
            'firstName': first_name,
            'lastName': last_name,
            'phoneNumber': (row.get('Phone Number') or row.get('Mobile Phone Number') or row.get('WhatsApp Phone Number') or '').strip(),
            'country': (row.get('Country/Region') or row.get('IP Country') or '').strip(),
            'stateRegion': (row.get('State/Region') or row.get('IP State/Region') or '').strip(),
            'city': (row.get('City') or row.get('IP City') or '').strip(),
            'linkedinUrl': (row.get('LinkedIn URL') or row.get('Linkedin account') or '').strip(),
            'education': (row.get('Education') or row.get('Degree') or '').strip(),
            'roleAppliedFor': (row.get('Job Title') or row.get('Current role') or '').strip(),
            'source': (row.get('Source') or row.get('Original Traffic Source') or row.get('Record source') or '').strip(),
            'cvUrl': (row.get('CV') or '').strip(),
            'stage': stage,
            'status': 'joined' if (row.get('Email') or '').strip().lower().endswith('@flolabsrd.com') or (row.get('Email') or '').strip().lower().endswith('@flolabsinnovations.com') else 'active',
            'notes': (row.get('Any other comment you think would be helpful.') or row.get('Message') or '').strip(),
        })

out.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'Wrote {len(rows)} rows to {out}')
