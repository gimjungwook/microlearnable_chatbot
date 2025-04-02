import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'firebase_options.dart'; // flutterfire configure로 생성된 파일

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Web Auth & Function',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: FunctionTester(),
    );
  }
}

class FunctionTester extends StatefulWidget {
  const FunctionTester({super.key});

  @override
  _FunctionTesterState createState() => _FunctionTesterState();
}

class _FunctionTesterState extends State<FunctionTester> {
  final TextEditingController _questionController = TextEditingController();
  final TextEditingController _studentNameController = TextEditingController();

  String _selectedExpectedDifficulty = "Simple";
  String _selectedExpectedType = "Concept Understanding";
  String _selectedCodingSkillLevel = "Beginner";
  String _selectedCourseName = "Flutter Development";
  String _selectedLanguagePreference = "English";
  String _selectedPersona = "Encouraging Chatbot Mentor";
  String _selectedModelChoice = "gemini20Flash";
  String _style = _getStyleForPersona("Encouraging Chatbot Mentor");

  String _response = "";
  bool _isLoading = false;

  static String _getStyleForPersona(String persona) {
    switch (persona) {
      case "Encouraging Chatbot Mentor":
        return "A warm and supportive mentor who provides positive feedback...";
      case "Dark Fantasy Overlord Mentor":
        return "A mysterious, slightly ominous mentor...";
      case "Senpai Coding Date Mentor":
        return "A charming and affectionate mentor...";
      default:
        return "A neutral and informative mentor.";
    }
  }

  Future<void> _signInWithGoogleWeb() async {
    try {
      final googleProvider = GoogleAuthProvider();
      await FirebaseAuth.instance.signInWithPopup(googleProvider);
    } catch (e) {
      print("Google 로그인 실패: $e");
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text("Login failed: $e"),
      ));
    }
  }

  Future<void> _signOut() async {
    await FirebaseAuth.instance.signOut();
  }

  Future<void> _submit() async {
    setState(() {
      _isLoading = true;
      _response = "";
    });

    _style = _getStyleForPersona(_selectedPersona);

    if (_style.isEmpty) {
      setState(() {
        _response = "❌ Error: Style is empty. Please check persona selection.";
        _isLoading = false;
      });
      return;
    }

    final requestData = {
      "question": _questionController.text,
      "expected_difficulty": _selectedExpectedDifficulty,
      "expected_type": _selectedExpectedType,
      "studentName": _studentNameController.text,
      "codingSkillLevel": _selectedCodingSkillLevel,
      "courseName": _selectedCourseName,
      "languagePreference": _selectedLanguagePreference,
      "persona": _selectedPersona,
      "style": _style,
      "modelChoice": _selectedModelChoice,
    };

    print("📦 Sending request data:\n${jsonEncode(requestData)}");

    try {
      final callable =
          FirebaseFunctions.instance.httpsCallable('processQuestion');
      final result = await callable.call(requestData);

      setState(() {
        _response = const JsonEncoder.withIndent('  ').convert(result.data);
      });
    } catch (e) {
      setState(() {
        _response = "❌ Error: $e";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _questionController.dispose();
    _studentNameController.dispose();
    super.dispose();
  }

  Widget _buildResponseView() {
    if (_response.isEmpty) return Container();

    try {
      final Map<String, dynamic> parsedJson = jsonDecode(_response);
      final answer = parsedJson['answer'] ?? "";
      final prettyJson = const JsonEncoder.withIndent('  ').convert(parsedJson);

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("📘 AI's Answer",
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          MarkdownBody(data: answer),
          const SizedBox(height: 20),
          const Text("🧾 Full JSON Response",
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SelectableText(prettyJson),
            ),
          ),
        ],
      );
    } catch (e) {
      return SelectableText("⚠️ Failed to parse response:\n$_response");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Genkit Chatbot Flow"),
        actions: [
          StreamBuilder<User?>(
            stream: FirebaseAuth.instance.authStateChanges(),
            builder: (context, snapshot) {
              final user = snapshot.data;
              if (user == null) {
                return TextButton(
                  onPressed: _signInWithGoogleWeb,
                  child: const Text(
                    "Sign In",
                  ),
                );
              } else {
                return Row(
                  children: [
                    Text(
                      user.displayName ?? "User",
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                        onPressed: _signOut,
                        child: const Text(
                          "Logout",
                        )),
                  ],
                );
              }
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            TextField(
              controller: _questionController,
              decoration: const InputDecoration(labelText: "Question"),
            ),
            TextField(
              controller: _studentNameController,
              decoration: const InputDecoration(labelText: "Student Name"),
            ),
            DropdownButtonFormField<String>(
              value: _selectedExpectedDifficulty,
              decoration:
                  const InputDecoration(labelText: "Expected Difficulty"),
              items: ["Simple", "Complex"]
                  .map((val) => DropdownMenuItem(value: val, child: Text(val)))
                  .toList(),
              onChanged: (val) =>
                  setState(() => _selectedExpectedDifficulty = val!),
            ),
            DropdownButtonFormField<String>(
              value: _selectedExpectedType,
              decoration: const InputDecoration(labelText: "Expected Type"),
              items: ["Concept Understanding", "Debugging/Error Fixing"]
                  .map((val) => DropdownMenuItem(value: val, child: Text(val)))
                  .toList(),
              onChanged: (val) => setState(() => _selectedExpectedType = val!),
            ),
            DropdownButtonFormField<String>(
              value: _selectedCodingSkillLevel,
              decoration: const InputDecoration(labelText: "Skill Level"),
              items: ["Beginner", "Intermediate", "Advanced"]
                  .map((val) => DropdownMenuItem(value: val, child: Text(val)))
                  .toList(),
              onChanged: (val) =>
                  setState(() => _selectedCodingSkillLevel = val!),
            ),
            DropdownButtonFormField<String>(
              value: _selectedCourseName,
              decoration: const InputDecoration(labelText: "Course"),
              items: ["Flutter Development"]
                  .map((val) => DropdownMenuItem(value: val, child: Text(val)))
                  .toList(),
              onChanged: (val) => setState(() => _selectedCourseName = val!),
            ),
            DropdownButtonFormField<String>(
              value: _selectedLanguagePreference,
              decoration:
                  const InputDecoration(labelText: "Language Preference"),
              items: ["English", "Korean", "Khmer"]
                  .map((val) => DropdownMenuItem(value: val, child: Text(val)))
                  .toList(),
              onChanged: (val) =>
                  setState(() => _selectedLanguagePreference = val!),
            ),
            DropdownButtonFormField<String>(
              value: _selectedPersona,
              decoration: const InputDecoration(labelText: "Persona"),
              items: [
                "Encouraging Chatbot Mentor",
                "Dark Fantasy Overlord Mentor",
                "Senpai Coding Date Mentor"
              ]
                  .map((val) => DropdownMenuItem(value: val, child: Text(val)))
                  .toList(),
              onChanged: (val) {
                setState(() {
                  _selectedPersona = val!;
                  _style = _getStyleForPersona(val);
                });
              },
            ),
            DropdownButtonFormField<String>(
              value: _selectedModelChoice,
              decoration: const InputDecoration(labelText: "Model Choice"),
              items: ["gemini15Flash8b", "gemini20Flash"]
                  .map((val) => DropdownMenuItem(value: val, child: Text(val)))
                  .toList(),
              onChanged: (val) => setState(() => _selectedModelChoice = val!),
            ),
            const SizedBox(height: 20),
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ElevatedButton(
                    onPressed: FirebaseAuth.instance.currentUser == null
                        ? null
                        : _submit,
                    child: const Text("Submit")),
            const SizedBox(height: 20),
            _buildResponseView(),
          ],
        ),
      ),
    );
  }
}
