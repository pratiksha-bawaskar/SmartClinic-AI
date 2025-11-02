#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class SmartClinicAPITester:
    def __init__(self, base_url="https://health-assistant-34.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@smartclinic.com"
        self.test_password = "TestPass123!"
        self.test_patient_id = None
        self.test_appointment_id = None

    def log_test(self, name, success, details="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return None

    def test_health_check(self):
        """Test basic API health"""
        print("\n🔍 Testing API Health Check...")
        response = self.make_request('GET', '', auth_required=False)
        
        if response and response.status_code == 200:
            self.log_test("API Health Check", True, response_data=response.json())
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("API Health Check", False, error_msg)

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        user_data = {
            "email": self.test_email,
            "password": self.test_password,
            "full_name": "Test Doctor",
            "role": "doctor"
        }
        
        response = self.make_request('POST', 'auth/register', user_data, auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'user' in data:
                self.token = data['access_token']
                self.user_data = data['user']
                self.log_test("User Registration", True, response_data=data)
                return True
            else:
                self.log_test("User Registration", False, "Missing token or user data")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    error_msg += f", Detail: {error_detail}"
                except:
                    pass
            self.log_test("User Registration", False, error_msg)
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = self.make_request('POST', 'auth/login', login_data, auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data:
                self.log_test("User Login", True, response_data=data)
                return True
            else:
                self.log_test("User Login", False, "Missing access token")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("User Login", False, error_msg)
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        print("\n🔍 Testing Get Current User...")
        
        response = self.make_request('GET', 'auth/me')
        
        if response and response.status_code == 200:
            data = response.json()
            if 'email' in data and data['email'] == self.test_email:
                self.log_test("Get Current User", True, response_data=data)
                return True
            else:
                self.log_test("Get Current User", False, "User data mismatch")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Get Current User", False, error_msg)
        return False

    def test_create_patient(self):
        """Test creating a patient"""
        print("\n🔍 Testing Create Patient...")
        
        patient_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": f"john.doe.{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+1234567890",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "address": "123 Main St, City, State",
            "medical_history": "No known allergies"
        }
        
        response = self.make_request('POST', 'patients', patient_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'id' in data:
                self.test_patient_id = data['id']
                self.log_test("Create Patient", True, response_data=data)
                return True
            else:
                self.log_test("Create Patient", False, "Missing patient ID")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Create Patient", False, error_msg)
        return False

    def test_get_patients(self):
        """Test getting all patients"""
        print("\n🔍 Testing Get Patients...")
        
        response = self.make_request('GET', 'patients')
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Patients", True, f"Found {len(data)} patients", data)
                return True
            else:
                self.log_test("Get Patients", False, "Response is not a list")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Get Patients", False, error_msg)
        return False

    def test_get_patient_by_id(self):
        """Test getting a specific patient"""
        if not self.test_patient_id:
            self.log_test("Get Patient by ID", False, "No patient ID available")
            return False
            
        print("\n🔍 Testing Get Patient by ID...")
        
        response = self.make_request('GET', f'patients/{self.test_patient_id}')
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('id') == self.test_patient_id:
                self.log_test("Get Patient by ID", True, response_data=data)
                return True
            else:
                self.log_test("Get Patient by ID", False, "Patient ID mismatch")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Get Patient by ID", False, error_msg)
        return False

    def test_update_patient(self):
        """Test updating a patient"""
        if not self.test_patient_id:
            self.log_test("Update Patient", False, "No patient ID available")
            return False
            
        print("\n🔍 Testing Update Patient...")
        
        update_data = {
            "medical_history": "Updated: No known allergies, recent checkup completed"
        }
        
        response = self.make_request('PUT', f'patients/{self.test_patient_id}', update_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "Updated:" in data.get('medical_history', ''):
                self.log_test("Update Patient", True, response_data=data)
                return True
            else:
                self.log_test("Update Patient", False, "Update not reflected")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Update Patient", False, error_msg)
        return False

    def test_create_appointment(self):
        """Test creating an appointment"""
        if not self.test_patient_id:
            self.log_test("Create Appointment", False, "No patient ID available")
            return False
            
        print("\n🔍 Testing Create Appointment...")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            "patient_id": self.test_patient_id,
            "patient_name": "John Doe",
            "doctor_name": "Dr. Smith",
            "appointment_date": tomorrow,
            "appointment_time": "10:00",
            "reason": "Regular checkup",
            "notes": "First appointment"
        }
        
        response = self.make_request('POST', 'appointments', appointment_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'id' in data:
                self.test_appointment_id = data['id']
                self.log_test("Create Appointment", True, response_data=data)
                return True
            else:
                self.log_test("Create Appointment", False, "Missing appointment ID")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Create Appointment", False, error_msg)
        return False

    def test_get_appointments(self):
        """Test getting all appointments"""
        print("\n🔍 Testing Get Appointments...")
        
        response = self.make_request('GET', 'appointments')
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Appointments", True, f"Found {len(data)} appointments", data)
                return True
            else:
                self.log_test("Get Appointments", False, "Response is not a list")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Get Appointments", False, error_msg)
        return False

    def test_update_appointment(self):
        """Test updating an appointment"""
        if not self.test_appointment_id:
            self.log_test("Update Appointment", False, "No appointment ID available")
            return False
            
        print("\n🔍 Testing Update Appointment...")
        
        update_data = {
            "status": "completed",
            "notes": "Appointment completed successfully"
        }
        
        response = self.make_request('PUT', f'appointments/{self.test_appointment_id}', update_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('status') == 'completed':
                self.log_test("Update Appointment", True, response_data=data)
                return True
            else:
                self.log_test("Update Appointment", False, "Status not updated")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Update Appointment", False, error_msg)
        return False

    def test_chatbot_message(self):
        """Test AI chatbot functionality"""
        print("\n🔍 Testing AI Chatbot...")
        
        chat_data = {
            "message": "What are the symptoms of a common cold?",
            "session_id": str(uuid.uuid4())
        }
        
        response = self.make_request('POST', 'chat/message', chat_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'response' in data and 'session_id' in data:
                # Check if response contains relevant health information
                response_text = data['response'].lower()
                if any(keyword in response_text for keyword in ['cold', 'symptom', 'fever', 'cough', 'health']):
                    self.log_test("AI Chatbot", True, f"Response: {data['response'][:100]}...")
                    return True
                else:
                    self.log_test("AI Chatbot", False, "Response doesn't seem health-related")
            else:
                self.log_test("AI Chatbot", False, "Missing response or session_id")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    error_msg += f", Detail: {error_detail}"
                except:
                    pass
            self.log_test("AI Chatbot", False, error_msg)
        return False

    def test_delete_appointment(self):
        """Test deleting an appointment"""
        if not self.test_appointment_id:
            self.log_test("Delete Appointment", False, "No appointment ID available")
            return False
            
        print("\n🔍 Testing Delete Appointment...")
        
        response = self.make_request('DELETE', f'appointments/{self.test_appointment_id}')
        
        if response and response.status_code == 200:
            self.log_test("Delete Appointment", True)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Delete Appointment", False, error_msg)
        return False

    def test_delete_patient(self):
        """Test deleting a patient"""
        if not self.test_patient_id:
            self.log_test("Delete Patient", False, "No patient ID available")
            return False
            
        print("\n🔍 Testing Delete Patient...")
        
        response = self.make_request('DELETE', f'patients/{self.test_patient_id}')
        
        if response and response.status_code == 200:
            self.log_test("Delete Patient", True)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Delete Patient", False, error_msg)
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SmartClinic AI Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Basic health check
        self.test_health_check()

        # Authentication tests
        if not self.test_user_registration():
            print("❌ Registration failed, skipping remaining tests")
            return self.generate_report()

        self.test_user_login()
        self.test_get_current_user()

        # Patient management tests
        self.test_create_patient()
        self.test_get_patients()
        self.test_get_patient_by_id()
        self.test_update_patient()

        # Appointment management tests
        self.test_create_appointment()
        self.test_get_appointments()
        self.test_update_appointment()

        # AI chatbot test
        self.test_chatbot_message()

        # Cleanup tests
        self.test_delete_appointment()
        self.test_delete_patient()

        return self.generate_report()

    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = SmartClinicAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())