'use client';

import React, { useState, useEffect } from 'react';
import { useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Eye,
  Download,
  BarChart3,
  Users,
  BookOpen,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface QuestionBank {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  pdfUrl: string;
  extractedQuestions: any[];
  isActive: boolean;
  usageCount: number;
  averageScore: number;
  createdAt: string;
  manager: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface UploadProgress {
  uploading: boolean;
  processing: boolean;
  progress: number;
  stage: string;
}

export default function QuestionBankPage() {
  const { user } = useSharedData();
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    uploading: false,
    processing: false,
    progress: 0,
    stage: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'B1',
    category: 'GENERAL',
    file: null as File | null
  });

  const levels = [
    { value: 'A1', label: 'A1 - Débutant' },
    { value: 'A2', label: 'A2 - Élémentaire' },
    { value: 'B1', label: 'B1 - Intermédiaire' },
    { value: 'B2', label: 'B2 - Intermédiaire avancé' },
    { value: 'C1', label: 'C1 - Avancé' },
    { value: 'C2', label: 'C2 - Maîtrise' }
  ];

  const categories = [
    { value: 'GENERAL', label: 'Général' },
    { value: 'IMMIGRATION', label: 'Immigration' },
    { value: 'WORK', label: 'Travail' },
    { value: 'DAILY_LIFE', label: 'Vie quotidienne' },
    { value: 'ACADEMIC', label: 'Académique' },
    { value: 'BUSINESS', label: 'Affaires' }
  ];

  useEffect(() => {
    fetchQuestionBanks();
  }, []);

  const fetchQuestionBanks = async () => {
    try {
      const response = await fetch('/api/voice-simulation/question-bank/my-banks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestionBanks(data.data);
      } else {
        toast.error('Erreur lors du chargement des banques de questions');
      }
    } catch (error) {
      console.error('Error fetching question banks:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Seuls les fichiers PDF sont acceptés');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error('Le fichier ne doit pas dépasser 10MB');
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Veuillez saisir un titre');
      return;
    }

    setUploadProgress({
      uploading: true,
      processing: false,
      progress: 0,
      stage: 'Téléchargement du fichier...'
    });

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('pdf', formData.file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('level', formData.level);
      uploadFormData.append('category', formData.category);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch('/api/voice-simulation/question-bank/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: uploadFormData
      });

      clearInterval(progressInterval);

      if (response.ok) {
        setUploadProgress({
          uploading: false,
          processing: true,
          progress: 100,
          stage: 'Extraction des questions en cours...'
        });

        // Simulate processing time
        setTimeout(() => {
          setUploadProgress({
            uploading: false,
            processing: false,
            progress: 100,
            stage: 'Terminé !'
          });

          toast.success('Banque de questions créée avec succès !');
          
          // Reset form
          setFormData({
            title: '',
            description: '',
            level: 'B1',
            category: 'GENERAL',
            file: null
          });

          // Reset file input
          const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
          if (fileInput) fileInput.value = '';

          // Refresh list
          fetchQuestionBanks();
        }, 3000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors du téléchargement');
        setUploadProgress({
          uploading: false,
          processing: false,
          progress: 0,
          stage: ''
        });
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Erreur de connexion');
      setUploadProgress({
        uploading: false,
        processing: false,
        progress: 0,
        stage: ''
      });
    }
  };

  const toggleQuestionBankStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/voice-simulation/question-bank/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`Banque de questions ${!isActive ? 'activée' : 'désactivée'}`);
        fetchQuestionBanks();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur de connexion');
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'A1': 'bg-green-100 text-green-800',
      'A2': 'bg-blue-100 text-blue-800',
      'B1': 'bg-yellow-100 text-yellow-800',
      'B2': 'bg-orange-100 text-orange-800',
      'C1': 'bg-red-100 text-red-800',
      'C2': 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'GENERAL': 'bg-gray-100 text-gray-800',
      'IMMIGRATION': 'bg-blue-100 text-blue-800',
      'WORK': 'bg-green-100 text-green-800',
      'DAILY_LIFE': 'bg-yellow-100 text-yellow-800',
      'ACADEMIC': 'bg-purple-100 text-purple-800',
      'BUSINESS': 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Banque de Questions VAPI
        </h1>
        <p className="text-gray-600">
          Gérez vos banques de questions pour les simulations vocales
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Télécharger PDF</TabsTrigger>
          <TabsTrigger value="manage">Gérer les banques</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Télécharger une nouvelle banque de questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Questions TCF Immigration 2024"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Niveau</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdf-file">Fichier PDF *</Label>
                    <Input
                      id="pdf-file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                    />
                    <p className="text-sm text-gray-500">
                      Taille maximale: 10MB. Format accepté: PDF uniquement.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description optionnelle de la banque de questions..."
                    rows={3}
                  />
                </div>

                {(uploadProgress.uploading || uploadProgress.processing) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{uploadProgress.stage}</span>
                      <span className="text-sm text-gray-500">{uploadProgress.progress}%</span>
                    </div>
                    <Progress value={uploadProgress.progress} className="w-full" />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={uploadProgress.uploading || uploadProgress.processing}
                >
                  {uploadProgress.uploading || uploadProgress.processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {uploadProgress.stage}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger et traiter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-bold">{questionBanks.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Actives</p>
                      <p className="text-2xl font-bold text-green-600">
                        {questionBanks.filter(qb => qb.isActive).length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Questions</p>
                      <p className="text-2xl font-bold">
                        {questionBanks.reduce((total, qb) => total + (qb.extractedQuestions?.length || 0), 0)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilisations</p>
                      <p className="text-2xl font-bold">
                        {questionBanks.reduce((total, qb) => total + qb.usageCount, 0)}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Question Banks List */}
            <div className="grid gap-4">
              {questionBanks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune banque de questions
                    </h3>
                    <p className="text-gray-500">
                      Commencez par télécharger votre premier fichier PDF.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                questionBanks.map((questionBank) => (
                  <Card key={questionBank.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{questionBank.title}</h3>
                            <Badge className={getLevelColor(questionBank.level)}>
                              {questionBank.level}
                            </Badge>
                            <Badge className={getCategoryColor(questionBank.category)}>
                              {categories.find(c => c.value === questionBank.category)?.label}
                            </Badge>
                            {questionBank.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                          
                          {questionBank.description && (
                            <p className="text-gray-600 mb-3">{questionBank.description}</p>
                          )}
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span>{questionBank.extractedQuestions?.length || 0} questions</span>
                            <span>{questionBank.usageCount} utilisations</span>
                            {questionBank.averageScore && (
                              <span>Score moyen: {questionBank.averageScore.toFixed(1)}/100</span>
                            )}
                            <span>Créé le {new Date(questionBank.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleQuestionBankStatus(questionBank.id, questionBank.isActive)}
                          >
                            {questionBank.isActive ? 'Désactiver' : 'Activer'}
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
