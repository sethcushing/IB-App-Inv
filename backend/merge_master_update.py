"""
One-time data merge script: Updates existing apps and inserts new ones
from MasterSoftwareListUpdate04102026_v1.xlsx
"""
import pandas as pd
import pymongo
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

client = pymongo.MongoClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

def derive_deployment_model(row):
    flags = []
    if row.get('SaaS') == 'X':
        flags.append('SaaS')
    if row.get('On_Premise') == 'X':
        flags.append('On-Premise')
    if row.get('IaaS_PaaS') == 'X':
        flags.append('IaaS/PaaS')
    if len(flags) == 0:
        return 'Unknown'
    if len(flags) == 1:
        return flags[0]
    return 'Multiple'

def derive_app_type(row):
    if row.get('Custom') == 'X':
        return 'Custom'
    return 'COTS'

def run_merge():
    df = pd.read_excel(Path(__file__).parent / 'master_update.xlsx')
    print(f"Loaded {len(df)} rows from Excel")

    # Build lookup of existing apps by lowercase title
    existing = {}
    for app in db.applications.find({}, {'_id': 0, 'app_id': 1, 'title': 1}):
        existing[app['title'].lower().strip()] = app['app_id']

    updated = 0
    inserted = 0
    skipped = 0

    for _, row in df.iterrows():
        norm_title = str(row.get('Normalized_Title', '')).strip()
        master_title = str(row.get('Master_Title', '')).strip()
        if not norm_title or norm_title == 'nan':
            skipped += 1
            continue

        # Derive new fields
        deployment_model = derive_deployment_model(row)
        app_type = derive_app_type(row)
        is_custom = row.get('Custom') == 'X'
        is_saas = row.get('SaaS') == 'X'
        is_on_premise = row.get('On_Premise') == 'X'
        is_iaas_paas = row.get('IaaS_PaaS') == 'X'
        pfa = row.get('Primary_functional_area_served')
        primary_functional_area = str(pfa).strip() if pd.notna(pfa) else None

        vendor = str(row.get('Vendor', '')).strip() if pd.notna(row.get('Vendor')) else None
        vendor_parent = str(row.get('Vendor_Parent', '')).strip() if pd.notna(row.get('Vendor_Parent')) else None

        okta_app = str(row.get('okta_application', '')).strip() if pd.notna(row.get('okta_application')) else None
        okta_id = str(row.get('okta_application_id', '')).strip() if pd.notna(row.get('okta_application_id')) else None
        okta_created = str(row.get('okta_created_date', '')).strip() if pd.notna(row.get('okta_created_date')) else None
        okta_updated = str(row.get('okta_last_updated_date', '')).strip() if pd.notna(row.get('okta_last_updated_date')) else None

        update_fields = {
            'deployment_model': deployment_model,
            'app_type': app_type,
            'is_custom': is_custom,
            'is_saas': is_saas,
            'is_on_premise': is_on_premise,
            'is_iaas_paas': is_iaas_paas,
            'last_updated': datetime.now(timezone.utc).isoformat(),
        }
        if primary_functional_area:
            update_fields['primary_functional_area'] = primary_functional_area
        if vendor_parent:
            update_fields['vendor_parent'] = vendor_parent
        if okta_app:
            update_fields['okta_app_name'] = okta_app
        if okta_id:
            update_fields['okta_app_id'] = okta_id

        # Try to match by normalized title, then master title
        app_id = existing.get(norm_title.lower()) or existing.get(master_title.lower())

        if app_id:
            db.applications.update_one({'app_id': app_id}, {'$set': update_fields})
            updated += 1
        else:
            # Insert new app
            new_doc = {
                'app_id': str(uuid.uuid4()),
                'title': norm_title,
                'master_title': master_title,
                'status': 'Active',
                'vendor': vendor,
                'vendor_parent': vendor_parent,
                'functional_category': primary_functional_area or 'Uncategorized',
                'primary_functional_area': primary_functional_area,
                'deployment_model': deployment_model,
                'app_type': app_type,
                'is_custom': is_custom,
                'is_saas': is_saas,
                'is_on_premise': is_on_premise,
                'is_iaas_paas': is_iaas_paas,
                'okta_app_name': okta_app,
                'okta_app_id': okta_id,
                'capabilities': None,
                'short_description': None,
                'data_sources': 'Master Software List Update',
                'labels': None,
                'notes': None,
                'users_with_sso_access': 0,
                'users_logging_in_via_sso': 0,
                'provisioned_users': 0,
                'engaged_users': 0,
                'contract_annual_spend': 0,
                'fiscal_ytd_expense_total': 0,
                'prev_fiscal_year_expense_total': 0,
                'cost_center_primary': None,
                'cost_centers': [],
                'product_owner_name': None,
                'business_pm': None,
                'support_lead': None,
                'lead_architect': None,
                'security_contact': None,
                'legal_contact': None,
                'procurement_contact': None,
                'general_contact': None,
                'last_updated': datetime.now(timezone.utc).isoformat(),
            }
            db.applications.insert_one(new_doc)
            inserted += 1

    # Set defaults for apps that weren't in the Excel (existing apps with no match)
    result = db.applications.update_many(
        {'deployment_model': {'$exists': False}},
        {'$set': {
            'deployment_model': 'Unknown',
            'app_type': 'COTS',
            'is_custom': False,
            'is_saas': False,
            'is_on_premise': False,
            'is_iaas_paas': False,
        }}
    )
    
    total = db.applications.count_documents({})
    print(f"Updated: {updated}, Inserted: {inserted}, Skipped: {skipped}")
    print(f"Defaulted {result.modified_count} existing apps with no match")
    print(f"Total apps in DB: {total}")

if __name__ == '__main__':
    run_merge()
