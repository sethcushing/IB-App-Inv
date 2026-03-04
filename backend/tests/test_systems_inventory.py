"""
Systems Inventory Dashboard - Backend API Tests
Tests for: Dashboard KPIs, Applications CRUD, Requests CRUD, Import functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://systems-tracker-1.preview.emergentagent.com').rstrip('/')


class TestDashboardEndpoints:
    """Dashboard API endpoint tests"""
    
    def test_dashboard_kpis(self):
        """Test dashboard KPIs endpoint returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_apps" in data
        assert "total_contract_spend" in data
        assert "total_ytd_expense" in data
        assert "total_engaged_users" in data
        assert "deployment_breakdown" in data
        
        # Verify deployment breakdown structure
        breakdown = data["deployment_breakdown"]
        assert "Cloud" in breakdown
        assert "On-Prem" in breakdown
        assert "Hybrid" in breakdown
        assert "Unknown" in breakdown
        
        print(f"Dashboard KPIs: {data['total_apps']} apps, ${data['total_contract_spend']:,.0f} spend")
    
    def test_dashboard_kpis_with_filters(self):
        """Test dashboard KPIs with deployment_type filter"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis?deployment_type=Cloud")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_apps"] >= 0
        print(f"Cloud apps: {data['total_apps']}")
    
    def test_spend_by_category(self):
        """Test spend by category endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/spend-by-category")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "category" in data[0]
            assert "total_spend" in data[0]
            print(f"Top category: {data[0]['category']} - ${data[0]['total_spend']:,.0f}")
    
    def test_apps_by_category(self):
        """Test apps by category endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/apps-by-category")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "category" in data[0]
            assert "count" in data[0]
            print(f"Top category by count: {data[0]['category']} - {data[0]['count']} apps")
    
    def test_spend_by_cost_center(self):
        """Test spend by cost center endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/spend-by-cost-center")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "cost_center" in data[0]
            assert "total_spend" in data[0]
    
    def test_high_spend_low_engagement(self):
        """Test high spend low engagement endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/high-spend-low-engagement?spend_threshold=50000&engagement_threshold=100")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"High spend/low engagement apps: {len(data)}")
    
    def test_executive_summary(self):
        """Test executive summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/executive-summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "summary" in data
        assert "metrics" in data
        assert isinstance(data["summary"], str)
        assert len(data["summary"]) > 0
        print(f"Executive summary: {data['summary'][:100]}...")
    
    def test_users_by_category(self):
        """Test users by category endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/users-by-category")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestApplicationsEndpoints:
    """Applications CRUD endpoint tests"""
    
    def test_get_applications(self):
        """Test get applications list"""
        response = requests.get(f"{BASE_URL}/api/applications?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "applications" in data
        assert "total" in data
        assert isinstance(data["applications"], list)
        print(f"Total applications: {data['total']}")
    
    def test_get_applications_with_filters(self):
        """Test get applications with various filters"""
        # Test deployment_type filter
        response = requests.get(f"{BASE_URL}/api/applications?deployment_type=Cloud&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
        
        # Test search filter
        response = requests.get(f"{BASE_URL}/api/applications?search=Microsoft&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "applications" in data
    
    def test_get_applications_sorting(self):
        """Test applications sorting"""
        response = requests.get(f"{BASE_URL}/api/applications?sort_by=contract_annual_spend&sort_order=desc&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        apps = data["applications"]
        if len(apps) >= 2:
            # Verify descending order
            assert apps[0].get("contract_annual_spend", 0) >= apps[1].get("contract_annual_spend", 0)
    
    def test_get_single_application(self):
        """Test get single application by ID"""
        # First get an app ID
        list_response = requests.get(f"{BASE_URL}/api/applications?limit=1")
        assert list_response.status_code == 200
        apps = list_response.json()["applications"]
        
        if len(apps) > 0:
            app_id = apps[0]["app_id"]
            response = requests.get(f"{BASE_URL}/api/applications/{app_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["app_id"] == app_id
            assert "title" in data
            print(f"Retrieved app: {data['title']}")
    
    def test_get_nonexistent_application(self):
        """Test 404 for nonexistent application"""
        response = requests.get(f"{BASE_URL}/api/applications/nonexistent-id-12345")
        assert response.status_code == 404
    
    def test_create_application(self):
        """Test create new application"""
        payload = {
            "title": "TEST_NewApp_Pytest",
            "vendor": "Test Vendor",
            "status": "under_review",
            "functional_category": "Testing",
            "deployment_type": "Cloud",
            "contract_annual_spend": 10000,
            "engaged_users": 50
        }
        
        response = requests.post(f"{BASE_URL}/api/applications", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "app_id" in data
        assert "message" in data
        print(f"Created app with ID: {data['app_id']}")
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/applications/{data['app_id']}")
        assert get_response.status_code == 200
        created_app = get_response.json()
        assert created_app["title"] == payload["title"]
        assert created_app["vendor"] == payload["vendor"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/applications/{data['app_id']}")
    
    def test_create_duplicate_application(self):
        """Test duplicate detection - should return 409"""
        # First get an existing app title
        list_response = requests.get(f"{BASE_URL}/api/applications?limit=1")
        apps = list_response.json()["applications"]
        
        if len(apps) > 0:
            existing_title = apps[0]["title"]
            
            payload = {
                "title": existing_title,
                "vendor": "Test Vendor"
            }
            
            response = requests.post(f"{BASE_URL}/api/applications", json=payload)
            assert response.status_code == 409
            print(f"Duplicate detection working for: {existing_title}")
    
    def test_update_application(self):
        """Test update application"""
        # Create test app first
        create_payload = {
            "title": "TEST_UpdateApp_Pytest",
            "vendor": "Original Vendor"
        }
        create_response = requests.post(f"{BASE_URL}/api/applications", json=create_payload)
        assert create_response.status_code == 200
        app_id = create_response.json()["app_id"]
        
        # Update
        update_payload = {
            "vendor": "Updated Vendor",
            "contract_annual_spend": 25000
        }
        update_response = requests.put(f"{BASE_URL}/api/applications/{app_id}", json=update_payload)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/applications/{app_id}")
        updated_app = get_response.json()
        assert updated_app["vendor"] == "Updated Vendor"
        assert updated_app["contract_annual_spend"] == 25000
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/applications/{app_id}")
    
    def test_delete_application(self):
        """Test delete application"""
        # Create test app
        create_payload = {"title": "TEST_DeleteApp_Pytest"}
        create_response = requests.post(f"{BASE_URL}/api/applications", json=create_payload)
        app_id = create_response.json()["app_id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/applications/{app_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/applications/{app_id}")
        assert get_response.status_code == 404


class TestRequestsEndpoints:
    """Requests CRUD endpoint tests"""
    
    @pytest.fixture
    def test_app_id(self):
        """Get a valid app_id for testing requests"""
        response = requests.get(f"{BASE_URL}/api/applications?limit=1")
        apps = response.json()["applications"]
        if len(apps) > 0:
            return apps[0]["app_id"]
        pytest.skip("No applications available for request testing")
    
    def test_get_requests(self):
        """Test get requests list"""
        response = requests.get(f"{BASE_URL}/api/requests")
        assert response.status_code == 200
        
        data = response.json()
        assert "requests" in data
        assert isinstance(data["requests"], list)
        print(f"Total requests: {len(data['requests'])}")
    
    def test_get_requests_with_filters(self):
        """Test get requests with status filter"""
        response = requests.get(f"{BASE_URL}/api/requests?status=Draft")
        assert response.status_code == 200
        
        data = response.json()
        assert "requests" in data
    
    def test_create_request(self, test_app_id):
        """Test create new request"""
        payload = {
            "app_id": test_app_id,
            "request_type": "Owner Info",
            "to_role": "Product Owner",
            "to_name": "Test User",
            "message": "TEST_Request from pytest",
            "priority": "Medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/requests", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "request_id" in data
        print(f"Created request: {data['request_id']}")
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/requests/{data['request_id']}")
        assert get_response.status_code == 200
        created_req = get_response.json()
        assert created_req["message"] == payload["message"]
        assert created_req["status"] == "Draft"
    
    def test_create_request_invalid_app(self):
        """Test create request with invalid app_id"""
        payload = {
            "app_id": "invalid-app-id-12345",
            "request_type": "Owner Info",
            "to_role": "Product Owner",
            "message": "Test message"
        }
        
        response = requests.post(f"{BASE_URL}/api/requests", json=payload)
        assert response.status_code == 404
    
    def test_update_request(self, test_app_id):
        """Test update request status"""
        # Create request first
        create_payload = {
            "app_id": test_app_id,
            "request_type": "Data Sources",
            "to_role": "IT Contact",
            "message": "TEST_Update request pytest"
        }
        create_response = requests.post(f"{BASE_URL}/api/requests", json=create_payload)
        request_id = create_response.json()["request_id"]
        
        # Update status
        update_payload = {"status": "Sent"}
        update_response = requests.put(f"{BASE_URL}/api/requests/{request_id}", json=update_payload)
        assert update_response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/requests/{request_id}")
        assert get_response.json()["status"] == "Sent"
    
    def test_send_request(self, test_app_id):
        """Test send request endpoint"""
        # Create request
        create_payload = {
            "app_id": test_app_id,
            "request_type": "Security Review",
            "to_role": "Security Contact",
            "message": "TEST_Send request pytest"
        }
        create_response = requests.post(f"{BASE_URL}/api/requests", json=create_payload)
        request_id = create_response.json()["request_id"]
        
        # Send
        send_response = requests.post(f"{BASE_URL}/api/requests/{request_id}/send")
        assert send_response.status_code == 200
        
        # Verify status changed to Sent
        get_response = requests.get(f"{BASE_URL}/api/requests/{request_id}")
        assert get_response.json()["status"] == "Sent"


class TestFilterOptions:
    """Filter options endpoint tests"""
    
    def test_get_filter_options(self):
        """Test filter options endpoint"""
        response = requests.get(f"{BASE_URL}/api/filters/options")
        assert response.status_code == 200
        
        data = response.json()
        assert "statuses" in data
        assert "categories" in data
        assert "vendors" in data
        assert "cost_centers" in data
        assert "deployment_types" in data
        
        # Verify deployment_types has expected values
        assert "Cloud" in data["deployment_types"]
        assert "On-Prem" in data["deployment_types"]
        print(f"Categories available: {len(data['categories'])}")


class TestImportEndpoints:
    """Import functionality endpoint tests"""
    
    def test_get_template(self):
        """Test get import template"""
        response = requests.get(f"{BASE_URL}/api/import/template")
        assert response.status_code == 200
        
        data = response.json()
        assert "headers" in data
        assert "sample_row" in data
        assert "Title" in data["headers"]
        print(f"Template has {len(data['headers'])} columns")


class TestYoYTrends:
    """YoY Trends endpoint tests"""
    
    def test_yoy_trends(self):
        """Test YoY trends endpoint for an application"""
        # Get an app ID first
        list_response = requests.get(f"{BASE_URL}/api/applications?limit=1")
        apps = list_response.json()["applications"]
        
        if len(apps) > 0:
            app_id = apps[0]["app_id"]
            response = requests.get(f"{BASE_URL}/api/dashboard/yoy/{app_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert "app_id" in data
            assert "trends" in data
            assert "yoy_changes" in data
            assert isinstance(data["trends"], list)
            
            if len(data["trends"]) > 0:
                trend = data["trends"][0]
                assert "year" in trend
                assert "spend" in trend
                assert "users" in trend
            
            print(f"YoY trends for {data.get('title', 'app')}: {len(data['trends'])} years of data")
    
    def test_yoy_trends_invalid_app(self):
        """Test YoY trends for nonexistent app"""
        response = requests.get(f"{BASE_URL}/api/dashboard/yoy/invalid-app-id")
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
