#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class RoleBasedDashboardTester:
    def __init__(self, base_url="https://spend-tracker-325.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def login_user(self, email, password, role_name):
        """Login and get token for a user"""
        print(f"\n🔐 Testing {role_name} login ({email})...")
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", 
                                   json={"email": email, "password": password})
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                user_data = data.get('user', {})
                
                self.tokens[role_name] = token
                self.log_test(f"{role_name} Login", True, f"Role: {user_data.get('role')}")
                
                # Get user profile with permissions
                headers = {'Authorization': f'Bearer {token}'}
                profile_res = requests.get(f"{self.base_url}/auth/me", headers=headers)
                
                if profile_res.status_code == 200:
                    profile = profile_res.json()
                    print(f"   Role: {profile.get('role')}")
                    print(f"   Can Edit: {profile.get('can_edit')}")
                    print(f"   Dashboard View: {profile.get('dashboard_view')}")
                    print(f"   Assigned Cost Centers: {profile.get('assigned_cost_centers', [])}")
                    return profile
                else:
                    self.log_test(f"{role_name} Profile Fetch", False, f"Status: {profile_res.status_code}")
                    return None
            else:
                self.log_test(f"{role_name} Login", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test(f"{role_name} Login", False, str(e))
            return None

    def test_applications_access(self, role_name, expected_range=None):
        """Test applications endpoint for role-based filtering"""
        if role_name not in self.tokens:
            return False
            
        print(f"\n📊 Testing {role_name} applications access...")
        
        try:
            headers = {'Authorization': f'Bearer {self.tokens[role_name]}'}
            response = requests.get(f"{self.base_url}/applications", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                total_apps = data.get('total', 0)
                apps = data.get('applications', [])
                
                print(f"   Total Apps: {total_apps}")
                print(f"   Apps Returned: {len(apps)}")
                
                if expected_range:
                    min_apps, max_apps = expected_range
                    if min_apps <= total_apps <= max_apps:
                        self.log_test(f"{role_name} App Count", True, f"{total_apps} apps (expected {min_apps}-{max_apps})")
                    else:
                        self.log_test(f"{role_name} App Count", False, f"{total_apps} apps (expected {min_apps}-{max_apps})")
                else:
                    self.log_test(f"{role_name} App Access", True, f"{total_apps} apps")
                
                # Check cost center filtering for non-admin roles
                if role_name != "Executive" and apps:
                    cost_centers = set()
                    for app in apps[:10]:  # Check first 10 apps
                        cc = app.get('cost_center_primary')
                        if cc:
                            cost_centers.add(cc)
                    print(f"   Cost Centers in results: {list(cost_centers)[:5]}...")
                
                return total_apps
            else:
                self.log_test(f"{role_name} App Access", False, f"Status: {response.status_code}")
                return 0
                
        except Exception as e:
            self.log_test(f"{role_name} App Access", False, str(e))
            return 0

    def test_dashboard_kpis(self, role_name):
        """Test dashboard KPIs endpoint"""
        if role_name not in self.tokens:
            return False
            
        print(f"\n📈 Testing {role_name} dashboard KPIs...")
        
        try:
            headers = {'Authorization': f'Bearer {self.tokens[role_name]}'}
            response = requests.get(f"{self.base_url}/dashboard/kpis", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Total Apps: {data.get('total_apps', 0)}")
                print(f"   Total Contract Spend: ${data.get('total_contract_spend', 0):,.0f}")
                print(f"   Total Engaged Users: {data.get('total_engaged_users', 0):,}")
                
                self.log_test(f"{role_name} Dashboard KPIs", True)
                return True
            else:
                self.log_test(f"{role_name} Dashboard KPIs", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(f"{role_name} Dashboard KPIs", False, str(e))
            return False

    def test_executive_summary(self, role_name):
        """Test executive summary endpoint for role-specific content"""
        if role_name not in self.tokens:
            return False
            
        print(f"\n📋 Testing {role_name} executive summary...")
        
        try:
            headers = {'Authorization': f'Bearer {self.tokens[role_name]}'}
            response = requests.get(f"{self.base_url}/dashboard/executive-summary", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                summary = data.get('summary', '')
                view_type = data.get('view_type', '')
                
                print(f"   View Type: {view_type}")
                print(f"   Summary: {summary[:100]}...")
                
                # Check for role-specific content
                role_keywords = {
                    "Executive": ["Portfolio Overview", "Executive"],
                    "IT Manager": ["IT Management", "Cost Centers"],
                    "Analyst": ["Usage Analytics", "engagement"]
                }
                
                expected_keywords = role_keywords.get(role_name, [])
                found_keywords = [kw for kw in expected_keywords if kw.lower() in summary.lower()]
                
                if found_keywords:
                    self.log_test(f"{role_name} Summary Content", True, f"Found: {found_keywords}")
                else:
                    self.log_test(f"{role_name} Summary Content", False, f"Missing keywords: {expected_keywords}")
                
                return True
            else:
                self.log_test(f"{role_name} Executive Summary", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(f"{role_name} Executive Summary", False, str(e))
            return False

    def test_application_edit_permissions(self, role_name, should_allow_edit):
        """Test application edit permissions"""
        if role_name not in self.tokens:
            return False
            
        print(f"\n✏️ Testing {role_name} edit permissions...")
        
        try:
            headers = {'Authorization': f'Bearer {self.tokens[role_name]}'}
            
            # First get an application
            apps_res = requests.get(f"{self.base_url}/applications?limit=1", headers=headers)
            if apps_res.status_code != 200:
                self.log_test(f"{role_name} Edit Test Setup", False, "Can't fetch apps")
                return False
                
            apps = apps_res.json().get('applications', [])
            if not apps:
                self.log_test(f"{role_name} Edit Test Setup", False, "No apps available")
                return False
                
            app_id = apps[0]['app_id']
            
            # Try to update the application
            update_data = {"notes": f"Test update by {role_name} at {datetime.now().isoformat()}"}
            response = requests.put(f"{self.base_url}/applications/{app_id}", 
                                  json=update_data, headers=headers)
            
            if should_allow_edit:
                if response.status_code == 200:
                    self.log_test(f"{role_name} Edit Permission", True, "Edit allowed as expected")
                else:
                    self.log_test(f"{role_name} Edit Permission", False, f"Edit blocked (status: {response.status_code})")
            else:
                if response.status_code == 403:
                    self.log_test(f"{role_name} Edit Permission", True, "Edit blocked as expected")
                else:
                    self.log_test(f"{role_name} Edit Permission", False, f"Edit allowed unexpectedly (status: {response.status_code})")
            
            return True
                
        except Exception as e:
            self.log_test(f"{role_name} Edit Permission", False, str(e))
            return False

    def run_comprehensive_test(self):
        """Run all tests for role-based dashboard"""
        print("🚀 Starting Role-Based Dashboard Testing")
        print("=" * 50)
        
        # Test credentials from the review request
        test_users = [
            {"email": "exec@demo.com", "password": "demo123", "role": "Executive", "expected_apps": (300, 400), "can_edit": True},
            {"email": "it@demo.com", "password": "demo123", "role": "IT Manager", "expected_apps": (80, 120), "can_edit": True},
            {"email": "analyst@demo.com", "password": "demo123", "role": "Analyst", "expected_apps": (40, 70), "can_edit": False}
        ]
        
        # Login all users
        user_profiles = {}
        for user in test_users:
            profile = self.login_user(user["email"], user["password"], user["role"])
            if profile:
                user_profiles[user["role"]] = profile
        
        # Test applications access for each role
        for user in test_users:
            if user["role"] in self.tokens:
                self.test_applications_access(user["role"], user["expected_apps"])
        
        # Test dashboard KPIs
        for user in test_users:
            if user["role"] in self.tokens:
                self.test_dashboard_kpis(user["role"])
        
        # Test executive summary
        for user in test_users:
            if user["role"] in self.tokens:
                self.test_executive_summary(user["role"])
        
        # Test edit permissions
        for user in test_users:
            if user["role"] in self.tokens:
                self.test_application_edit_permissions(user["role"], user["can_edit"])
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️ Some tests failed. Check details above.")
            return 1

def main():
    tester = RoleBasedDashboardTester()
    return tester.run_comprehensive_test()

if __name__ == "__main__":
    sys.exit(main())