"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/components/language-provider"
import {
  Search,
  Plus,
  MoreHorizontal,
  MessageSquare,
  Users,
  Send,
  Filter,
  Eye,
  Edit,
  Trash2,
  User,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export default function AdminMessages() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("instructors")

  // Empty data arrays - will be populated from backend
  const instructors: any[] = []
  const students: any[] = []
  const messages: any[] = []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "inactive":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "suspended":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "senior_manager":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "content_manager":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "junior_manager":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "instructor":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "student":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = (userList: any[]) => {
    if (selectedUsers.length === userList.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(userList.map(user => user.id))
    }
  }

  const filteredInstructors = instructors.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredStudents = students.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("Messages", "Messages")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Communiquez avec les instructeurs et les étudiants", "Communicate with instructors and students")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="border-gray-200 dark:border-gray-700"
            onClick={() => window.location.href = "/manager/messages/bulk?role=admin"}
          >
            <Users className="w-4 h-4 mr-2" />
            {t("Message groupé", "Bulk Message")}
          </Button>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("Nouveau message", "New Message")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-gray-200 dark:border-gray-700 text-foreground max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t("Composer un message", "Compose Message")}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {t("Envoyez un message aux utilisateurs sélectionnés", "Send a message to selected users")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-foreground">{t("Destinataires", "Recipients")}</Label>
                  <div className="p-3 bg-muted rounded-lg border border-gray-200 dark:border-gray-700">
                    {selectedUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(userId => {
                          const user = [...instructors, ...students].find(u => u.id === userId)
                          return user ? (
                            <Badge key={userId} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {user.name}
                              <button
                                onClick={() => handleUserSelect(userId)}
                                className="ml-2 text-blue-400 hover:text-blue-300"
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {t("Aucun destinataire sélectionné", "No recipients selected")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Sujet", "Subject")}</Label>
                  <Input
                    placeholder={t("Sujet du message...", "Message subject...")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">{t("Message", "Message")}</Label>
                  <Textarea
                    placeholder={t("Tapez votre message ici...", "Type your message here...")}
                    className="bg-input border-gray-200 dark:border-gray-700 text-foreground min-h-[200px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="urgent" className="border-gray-200 dark:border-gray-700" />
                  <Label htmlFor="urgent" className="text-foreground">
                    {t("Message urgent", "Urgent message")}
                  </Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsComposeOpen(false)} className="border-gray-200 dark:border-gray-700">
                    {t("Annuler", "Cancel")}
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    {t("Envoyer", "Send")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Instructeurs", "Instructors")}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{instructors.length}</div>
            <p className="text-xs text-blue-500 flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              {instructors.filter(i => i.status === 'active').length} {t("actifs", "active")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Étudiants", "Students")}
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{students.length}</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              {students.filter(s => s.status === 'active').length} {t("actifs", "active")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Messages envoyés", "Messages Sent")}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{messages.length}</div>
            <p className="text-xs text-purple-500 flex items-center mt-1">
              <Clock className="w-3 h-3 mr-1" />
              {t("Ce mois", "This month")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Sélectionnés", "Selected")}
            </CardTitle>
            <User className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{selectedUsers.length}</div>
            <p className="text-xs text-orange-500 flex items-center mt-1">
              <AlertCircle className="w-3 h-3 mr-1" />
              {t("Pour envoi", "For sending")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-foreground">{t("Filtres et Recherche", "Filters and Search")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t("Rechercher par nom ou email...", "Search by name or email...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-gray-200 dark:border-gray-700 text-foreground"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40 bg-input border-gray-200 dark:border-gray-700 text-foreground">
                <SelectValue placeholder={t("Statut", "Status")} />
              </SelectTrigger>
              <SelectContent className="bg-card border-gray-200 dark:border-gray-700">
                <SelectItem value="all">{t("Tous", "All")}</SelectItem>
                <SelectItem value="active">{t("Actif", "Active")}</SelectItem>
                <SelectItem value="inactive">{t("Inactif", "Inactive")}</SelectItem>
                <SelectItem value="suspended">{t("Suspendu", "Suspended")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="instructors"
            className="data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            {t("Instructeurs", "Instructors")}
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-muted text-muted-foreground data-[state=active]:text-foreground"
          >
            <Users className="w-4 h-4 mr-2" />
            {t("Étudiants", "Students")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instructors">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Liste des Instructeurs", "Instructors List")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Sélectionnez les instructeurs pour envoyer des messages", "Select instructors to send messages")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInstructors.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-instructors"
                        checked={selectedUsers.length === filteredInstructors.length && filteredInstructors.length > 0}
                        onCheckedChange={() => handleSelectAll(filteredInstructors)}
                        className="border-gray-200 dark:border-gray-700"
                      />
                      <Label htmlFor="select-all-instructors" className="text-foreground">
                        {t("Tout sélectionner", "Select All")}
                      </Label>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {filteredInstructors.length} {t("instructeurs", "instructors")}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-muted-foreground w-12"></TableHead>
                          <TableHead className="text-muted-foreground">{t("Instructeur", "Instructor")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Rôle", "Role")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Statut", "Status")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Dernière activité", "Last Activity")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Actions", "Actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInstructors.map((instructor) => (
                          <TableRow key={instructor.id} className="border-gray-200 dark:border-gray-700 hover:bg-muted/50">
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(instructor.id)}
                                onCheckedChange={() => handleUserSelect(instructor.id)}
                                className="border-gray-200 dark:border-gray-700"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {instructor.name?.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{instructor.name}</p>
                                  <p className="text-sm text-muted-foreground">{instructor.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getRoleColor(instructor.role)}>
                                {instructor.role === 'admin' ? t("Admin", "Admin") :
                                 instructor.role === 'senior_manager' ? t("Senior Manager", "Senior Manager") :
                                 instructor.role === 'content_manager' ? t("Content Manager", "Content Manager") :
                                 instructor.role === 'junior_manager' ? t("Junior Manager", "Junior Manager") :
                                 t("Instructeur", "Instructor")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(instructor.status)}>
                                {instructor.status === "active" ? t("Actif", "Active") : 
                                 instructor.status === "inactive" ? t("Inactif", "Inactive") : 
                                 t("Suspendu", "Suspended")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{instructor.lastActivity || t("Jamais", "Never")}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-card border-gray-200 dark:border-gray-700">
                                  <DropdownMenuItem className="text-foreground hover:bg-muted">
                                    <Eye className="w-4 h-4 mr-2" />
                                    {t("Voir le profil", "View Profile")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-foreground hover:bg-muted">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    {t("Envoyer un message", "Send Message")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucun instructeur trouvé</p>
                    <p className="text-sm">Les instructeurs apparaîtront ici une fois ajoutés</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card className="bg-card border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-foreground">{t("Liste des Étudiants", "Students List")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("Sélectionnez les étudiants pour envoyer des messages", "Select students to send messages")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-students"
                        checked={selectedUsers.length === filteredStudents.length && filteredStudents.length > 0}
                        onCheckedChange={() => handleSelectAll(filteredStudents)}
                        className="border-gray-200 dark:border-gray-700"
                      />
                      <Label htmlFor="select-all-students" className="text-foreground">
                        {t("Tout sélectionner", "Select All")}
                      </Label>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      {filteredStudents.length} {t("étudiants", "students")}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-muted-foreground w-12"></TableHead>
                          <TableHead className="text-muted-foreground">{t("Étudiant", "Student")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Niveau", "Level")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Statut", "Status")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Dernière activité", "Last Activity")}</TableHead>
                          <TableHead className="text-muted-foreground">{t("Actions", "Actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.id} className="border-gray-200 dark:border-gray-700 hover:bg-muted/50">
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(student.id)}
                                onCheckedChange={() => handleUserSelect(student.id)}
                                className="border-gray-200 dark:border-gray-700"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {student.name?.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{student.name}</p>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-200 dark:border-gray-700 text-foreground">
                                {student.level || t("Non défini", "Not defined")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(student.status)}>
                                {student.status === "active" ? t("Actif", "Active") : 
                                 student.status === "inactive" ? t("Inactif", "Inactive") : 
                                 t("Suspendu", "Suspended")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{student.lastActivity || t("Jamais", "Never")}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-card border-gray-200 dark:border-gray-700">
                                  <DropdownMenuItem className="text-foreground hover:bg-muted">
                                    <Eye className="w-4 h-4 mr-2" />
                                    {t("Voir le profil", "View Profile")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-foreground hover:bg-muted">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    {t("Envoyer un message", "Send Message")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucun étudiant trouvé</p>
                    <p className="text-sm">Les étudiants apparaîtront ici une fois inscrits</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

