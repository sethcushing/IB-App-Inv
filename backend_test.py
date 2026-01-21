#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class RoleBasedDashboardTester:
    def __init__(self, base_url="https://inventory-central-11.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.demo_accounts = [
            {"email": "exec@demo.com", "password": "demo123", "name": "Executive", "role": "admin", "expected_apps": (300, 400), "can_edit": True},
            {"email": "it@demo.com", "password": "demo123", "name": "IT Manager", "role": "manager", "expected_apps": (80, 120), "can_edit": True},
            {"email": "analyst@demo.com", "password": "demo123", "name": "Analyst", "role": "viewer", "expected_apps": (40, 70), "can_edit": False}
        ]

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASS", "details": f"Status: {response.status_code}"})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.test_results.append({"test": name, "status": "FAIL", "details": f"Expected {expected_status}, got {response.status_code}"})

            try:
                return success, response.json() if response.text else {}
            except:
                return success, {"raw_response": response.text}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "ERROR", "details": str(e)})
            return False, {}

    def test_demo_login(self, account):
        """Test login with demo account"""
        success, response = self.run_test(
            f"Login as {account['name']}",
            "POST",
            "auth/login",
            200,
            data={"email": account["email"], "password": account["password"]}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained for {account['name']}")
            return True, response
        return False, response

    def test_register_demo_account(self, account):
        """Test registering demo account if login fails"""
        success, response = self.run_test(
            f"Register {account['name']}",
            "POST",
            "auth/register",
            200,
            data={
                "email": account["email"], 
                "password": account["password"],
                "name": account["name"],
                "role": account["role"]
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True, response
        return False, response

    def test_get_me(self):
        """Test getting current user info"""
        return self.run_test("Get current user", "GET", "auth/me", 200)

    def test_seed_data(self):
        """Test seeding sample data"""
        return self.run_test("Seed sample data", "POST", "seed", 200)

    def test_dashboard_kpis(self):
        """Test dashboard KPIs endpoint"""
        return self.run_test("Dashboard KPIs", "GET", "dashboard/kpis", 200)

    def test_dashboard_charts(self):
        """Test dashboard chart endpoints"""
        endpoints = [
            "dashboard/spend-by-category",
            "dashboard/apps-by-category", 
            "dashboard/spend-by-cost-center",
            "dashboard/users-by-category",
            "dashboard/executive-summary"
        ]
        
        results = []
        for endpoint in endpoints:
            success, response = self.run_test(f"Chart: {endpoint.split('/')[-1]}", "GET", endpoint, 200)
            results.append((success, response))
        return results

    def test_applications_crud(self):
        """Test applications CRUD operations"""
        # Get applications
        success, apps_response = self.run_test("Get applications", "GET", "applications", 200)
        if not success:
            return False
        
        # Create application
        test_app = {
            "title": "Test Application",
            "vendor": "Test Vendor",
            "functional_category": "Testing",
            "deployment_type": "Cloud",
            "contract_annual_spend": 50000,
            "engaged_users": 100
        }
        
        success, create_response = self.run_test("Create application", "POST", "applications", 200, test_app)
        if not success:
            return False
        
        app_id = create_response.get('app_id')
        if not app_id:
            print("❌ No app_id returned from create")
            return False
        
        # Get specific application
        success, get_response = self.run_test("Get specific application", "GET", f"applications/{app_id}", 200)
        if not success:
            return False
        
        # Update application
        update_data = {"deployment_type": "On-Prem"}
        success, update_response = self.run_test("Update application", "PUT", f"applications/{app_id}", 200, update_data)
        if not success:
            return False
        
        # Delete application
        success, delete_response = self.run_test("Delete application", "DELETE", f"applications/{app_id}", 200)
        return success

    def test_requests_workflow(self):
        """Test requests workflow"""
        # Get applications first
        success, apps_response = self.run_test("Get apps for request test", "GET", "applications?limit=1", 200)
        if not success or not apps_response.get('applications'):
            print("❌ No applications found for request test")
            return False
        
        app_id = apps_response['applications'][0]['app_id']
        
        # Create request
        test_request = {
            "app_id": app_id,
            "request_type": "Usage Validation",
            "to_role": "Product Owner",
            "message": "Test request message",
            "priority": "Medium"
        }
        
        success, create_response = self.run_test("Create request", "POST", "requests", 200, test_request)
        if not success:
            return False
        
        request_id = create_response.get('request_id')
        if not request_id:
            print("❌ No request_id returned")
            return False
        
        # Get requests
        success, get_response = self.run_test("Get requests", "GET", "requests", 200)
        if not success:
            return False
        
        # Update request status
        success, update_response = self.run_test("Update request", "PUT", f"requests/{request_id}", 200, {"status": "Sent"})
        if not success:
            return False
        
        # Send request
        success, send_response = self.run_test("Send request", "POST", f"requests/{request_id}/send", 200)
        return success

    def test_filters_and_options(self):
        """Test filter options endpoint"""
        return self.run_test("Filter options", "GET", "filters/options", 200)

    def test_high_spend_low_engagement(self):
        """Test high spend low engagement endpoint"""
        return self.run_test("High spend low engagement", "GET", "dashboard/high-spend-low-engagement?spend_threshold=10000&engagement_threshold=50", 200)

def main():
    print("🚀 Starting Systems Inventory Dashboard API Tests")
    print("=" * 60)
    
    tester = SystemsInventoryAPITester()
    
    # Test authentication with demo accounts
    auth_success = False
    for account in tester.demo_accounts:
        print(f"\n📋 Testing authentication for {account['name']}")
        
        # Try login first
        login_success, login_response = tester.test_demo_login(account)
        if login_success:
            auth_success = True
            break
        else:
            # Try register if login fails
            register_success, register_response = tester.test_register_demo_account(account)
            if register_success:
                auth_success = True
                break
    
    if not auth_success:
        print("❌ Authentication failed for all demo accounts")
        return 1
    
    # Test user info
    tester.test_get_me()
    
    # Test seeding data
    print(f"\n📋 Testing data seeding")
    tester.test_seed_data()
    
    # Test dashboard endpoints
    print(f"\n📋 Testing dashboard endpoints")
    tester.test_dashboard_kpis()
    tester.test_dashboard_charts()
    tester.test_high_spend_low_engagement()
    
    # Test applications CRUD
    print(f"\n📋 Testing applications CRUD")
    tester.test_applications_crud()
    
    # Test requests workflow
    print(f"\n📋 Testing requests workflow")
    tester.test_requests_workflow()
    
    # Test filters
    print(f"\n📋 Testing filters")
    tester.test_filters_and_options()
    
    # Print results
    print(f"\n📊 Test Results Summary")
    print("=" * 60)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if t['status'] != 'PASS']
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"  - {test['test']}: {test['details']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())