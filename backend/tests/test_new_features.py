"""
Test suite for new dashboard features:
- Deployment Model chart endpoint
- Custom vs COTS chart endpoint
- Apps by Functional Area chart endpoint
- New filter options (deployment_models, app_types, functional_areas)
- Application filtering by deployment_model, app_type, primary_functional_area
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://systems-rollup.preview.emergentagent.com')


class TestDashboardKPIs:
    """Test dashboard KPIs endpoint with expected counts"""
    
    def test_kpis_total_apps(self):
        """Verify total apps count is 441"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        assert data["total_apps"] == 441, f"Expected 441 total apps, got {data['total_apps']}"
    
    def test_kpis_active_inactive_counts(self):
        """Verify active (244) and inactive (197) counts"""
        response = requests.get(f"{BASE_URL}/api/dashboard/kpis")
        assert response.status_code == 200
        data = response.json()
        assert data["active_apps"] == 244, f"Expected 244 active apps, got {data['active_apps']}"
        assert data["inactive_apps"] == 197, f"Expected 197 inactive apps, got {data['inactive_apps']}"


class TestDeploymentModelEndpoint:
    """Test GET /api/dashboard/deployment-model endpoint"""
    
    def test_deployment_model_returns_array(self):
        """Verify endpoint returns array with model, count, total_spend"""
        response = requests.get(f"{BASE_URL}/api/dashboard/deployment-model")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be an array"
        assert len(data) > 0, "Should have at least one deployment model"
        
        # Verify structure
        for item in data:
            assert "model" in item, "Each item should have 'model' field"
            assert "count" in item, "Each item should have 'count' field"
            assert "total_spend" in item, "Each item should have 'total_spend' field"
    
    def test_deployment_model_has_saas(self):
        """Verify SaaS is present with expected count"""
        response = requests.get(f"{BASE_URL}/api/dashboard/deployment-model")
        data = response.json()
        saas_item = next((d for d in data if d["model"] == "SaaS"), None)
        assert saas_item is not None, "SaaS should be in deployment models"
        assert saas_item["count"] == 306, f"Expected 306 SaaS apps, got {saas_item['count']}"
    
    def test_deployment_model_has_on_premise(self):
        """Verify On-Premise is present"""
        response = requests.get(f"{BASE_URL}/api/dashboard/deployment-model")
        data = response.json()
        on_prem = next((d for d in data if d["model"] == "On-Premise"), None)
        assert on_prem is not None, "On-Premise should be in deployment models"
        assert on_prem["count"] == 47, f"Expected 47 On-Premise apps, got {on_prem['count']}"
    
    def test_deployment_model_has_iaas_paas(self):
        """Verify IaaS/PaaS is present"""
        response = requests.get(f"{BASE_URL}/api/dashboard/deployment-model")
        data = response.json()
        iaas = next((d for d in data if d["model"] == "IaaS/PaaS"), None)
        assert iaas is not None, "IaaS/PaaS should be in deployment models"


class TestCustomVsCotsEndpoint:
    """Test GET /api/dashboard/custom-vs-cots endpoint"""
    
    def test_custom_vs_cots_returns_array(self):
        """Verify endpoint returns array with type, count, total_spend"""
        response = requests.get(f"{BASE_URL}/api/dashboard/custom-vs-cots")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be an array"
        
        # Verify structure
        for item in data:
            assert "type" in item, "Each item should have 'type' field"
            assert "count" in item, "Each item should have 'count' field"
            assert "total_spend" in item, "Each item should have 'total_spend' field"
    
    def test_custom_vs_cots_has_cots(self):
        """Verify COTS is present with expected count"""
        response = requests.get(f"{BASE_URL}/api/dashboard/custom-vs-cots")
        data = response.json()
        cots_item = next((d for d in data if d["type"] == "COTS"), None)
        assert cots_item is not None, "COTS should be in response"
        assert cots_item["count"] == 424, f"Expected 424 COTS apps, got {cots_item['count']}"
    
    def test_custom_vs_cots_has_custom(self):
        """Verify Custom is present with expected count (17)"""
        response = requests.get(f"{BASE_URL}/api/dashboard/custom-vs-cots")
        data = response.json()
        custom_item = next((d for d in data if d["type"] == "Custom"), None)
        assert custom_item is not None, "Custom should be in response"
        assert custom_item["count"] == 17, f"Expected 17 Custom apps, got {custom_item['count']}"


class TestAppsByFunctionalAreaEndpoint:
    """Test GET /api/dashboard/apps-by-functional-area endpoint"""
    
    def test_functional_area_returns_array(self):
        """Verify endpoint returns array with area, count, total_spend"""
        response = requests.get(f"{BASE_URL}/api/dashboard/apps-by-functional-area")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be an array"
        
        # Verify structure
        for item in data:
            assert "area" in item, "Each item should have 'area' field"
            assert "count" in item, "Each item should have 'count' field"
            assert "total_spend" in item, "Each item should have 'total_spend' field"
    
    def test_functional_area_has_it(self):
        """Verify IT is present as top functional area"""
        response = requests.get(f"{BASE_URL}/api/dashboard/apps-by-functional-area")
        data = response.json()
        it_item = next((d for d in data if d["area"] == "IT"), None)
        assert it_item is not None, "IT should be in functional areas"
        assert it_item["count"] == 66, f"Expected 66 IT apps, got {it_item['count']}"
    
    def test_functional_area_has_sales(self):
        """Verify Sales is present"""
        response = requests.get(f"{BASE_URL}/api/dashboard/apps-by-functional-area")
        data = response.json()
        sales_item = next((d for d in data if d["area"] == "Sales"), None)
        assert sales_item is not None, "Sales should be in functional areas"
        assert sales_item["count"] == 43, f"Expected 43 Sales apps, got {sales_item['count']}"
    
    def test_functional_area_has_engineering(self):
        """Verify Engineering is present"""
        response = requests.get(f"{BASE_URL}/api/dashboard/apps-by-functional-area")
        data = response.json()
        eng_item = next((d for d in data if d["area"] == "Engineering"), None)
        assert eng_item is not None, "Engineering should be in functional areas"


class TestFilterOptionsEndpoint:
    """Test GET /api/filters/options endpoint for new fields"""
    
    def test_filter_options_has_deployment_models(self):
        """Verify deployment_models array is present"""
        response = requests.get(f"{BASE_URL}/api/filters/options")
        assert response.status_code == 200
        data = response.json()
        assert "deployment_models" in data, "deployment_models should be in filter options"
        assert isinstance(data["deployment_models"], list)
        assert "SaaS" in data["deployment_models"]
        assert "On-Premise" in data["deployment_models"]
    
    def test_filter_options_has_app_types(self):
        """Verify app_types array is present"""
        response = requests.get(f"{BASE_URL}/api/filters/options")
        data = response.json()
        assert "app_types" in data, "app_types should be in filter options"
        assert isinstance(data["app_types"], list)
        assert "COTS" in data["app_types"]
        assert "Custom" in data["app_types"]
    
    def test_filter_options_has_functional_areas(self):
        """Verify functional_areas array is present"""
        response = requests.get(f"{BASE_URL}/api/filters/options")
        data = response.json()
        assert "functional_areas" in data, "functional_areas should be in filter options"
        assert isinstance(data["functional_areas"], list)
        assert "IT" in data["functional_areas"]
        assert "Sales" in data["functional_areas"]


class TestApplicationFiltering:
    """Test application filtering by new fields"""
    
    def test_filter_by_deployment_model_saas(self):
        """Verify filtering by deployment_model=SaaS returns 306 results"""
        response = requests.get(f"{BASE_URL}/api/applications?deployment_model=SaaS&limit=1")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 306, f"Expected 306 SaaS apps, got {data['total']}"
    
    def test_filter_by_app_type_custom(self):
        """Verify filtering by app_type=Custom returns 17 results"""
        response = requests.get(f"{BASE_URL}/api/applications?app_type=Custom&limit=1")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 17, f"Expected 17 Custom apps, got {data['total']}"
    
    def test_filter_by_primary_functional_area_it(self):
        """Verify filtering by primary_functional_area=IT returns results"""
        response = requests.get(f"{BASE_URL}/api/applications?primary_functional_area=IT&limit=1")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 66, f"Expected 66 IT apps, got {data['total']}"


class TestApplicationDetailNewFields:
    """Test application detail page shows new fields"""
    
    def test_linkedin_sales_navigator_has_new_fields(self):
        """Verify LinkedIn Sales Navigator has deployment_model, app_type, primary_functional_area"""
        app_id = "9f2140f2-0b8a-4fbb-b278-d12c520d41f5"
        response = requests.get(f"{BASE_URL}/api/applications/{app_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify new fields exist
        assert "deployment_model" in data, "deployment_model field should exist"
        assert "app_type" in data, "app_type field should exist"
        assert "primary_functional_area" in data, "primary_functional_area field should exist"
        
        # Verify values
        assert data["app_type"] == "COTS", f"Expected COTS, got {data['app_type']}"
        assert data["primary_functional_area"] == "Sales", f"Expected Sales, got {data['primary_functional_area']}"


class TestExistingDashboardCharts:
    """Verify existing dashboard charts still work"""
    
    def test_spend_by_category_works(self):
        """Verify spend-by-category endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/dashboard/spend-by-category")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_apps_by_category_works(self):
        """Verify apps-by-category endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/dashboard/apps-by-category")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_spend_by_cost_center_works(self):
        """Verify spend-by-cost-center endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/dashboard/spend-by-cost-center")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
