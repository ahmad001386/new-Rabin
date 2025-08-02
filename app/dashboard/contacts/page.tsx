'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Building,
  Calendar,
  Activity,
  MoreHorizontal,
  MessageCircle,
  Eye,
  Edit,
  Trash2,
  Users,
  Star,
  MapPin,
  Linkedin,
  Twitter,
  Globe,
  Filter
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  status: string;
  logo_url?: string;
}

interface Contact {
  id: string;
  customer_id?: string;
  company?: Company;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  linkedin_url?: string;
  twitter_url?: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  country?: string;
  status: string;
  is_primary: boolean;
  source: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  contact_id: string;
  activity_type: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    customer_id: 'individual',
    first_name: '',
    last_name: '',
    job_title: '',
    department: '',
    email: '',
    phone: '',
    mobile: '',
    linkedin_url: '',
    twitter_url: '',
    address: '',
    city: '',
    country: 'ایران',
    source: 'other',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts');
      const data = await response.json();

      if (data.success) {
        setContacts(data.data);
      } else {
        toast({
          title: "خطا",
          description: "خطا در بارگذاری مخاطبین",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/customers?limit=100');
      const data = await response.json();

      if (data.success) {
        setCompanies(data.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchContactActivities = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/activities`);
      const data = await response.json();

      if (data.success) {
        setActivities(data.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleCreateContact = async () => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "موفق",
          description: "مخاطب جدید اضافه شد"
        });
        setOpen(false);
        setNewContact({
          customer_id: 'individual',
          first_name: '',
          last_name: '',
          job_title: '',
          department: '',
          email: '',
          phone: '',
          mobile: '',
          linkedin_url: '',
          twitter_url: '',
          address: '',
          city: '',
          country: 'ایران',
          source: 'other',
          notes: ''
        });
        fetchContacts();
      } else {
        toast({
          title: "خطا",
          description: data.message || "خطا در افزودن مخاطب",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive"
      });
    }
  };

  const handleViewProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setProfileOpen(true);
    fetchContactActivities(contact.id);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesCompany = companyFilter === 'all' ||
      (companyFilter === 'individual' && (contact.customer_id === 'individual' || !contact.customer_id)) ||
      (companyFilter !== 'individual' && contact.customer_id === companyFilter);

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'website':
        return 'bg-blue-100 text-blue-700';
      case 'referral':
        return 'bg-green-100 text-green-700';
      case 'social_media':
        return 'bg-purple-100 text-purple-700';
      case 'cold_call':
        return 'bg-orange-100 text-orange-700';
      case 'trade_show':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'note':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-vazir">مخاطبین</h1>
          <p className="text-muted-foreground font-vazir">
            مدیریت اطلاعات مخاطبین و ارتباطات
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-vazir">
              <UserPlus className="h-4 w-4 ml-2" />
              افزودن مخاطب
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-vazir">افزودن مخاطب جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic" className="font-vazir">اطلاعات پایه</TabsTrigger>
                  <TabsTrigger value="additional" className="font-vazir">اطلاعات تکمیلی</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  {/* Company Selection */}
                  <div className="space-y-2">
                    <Label className="font-vazir">شرکت</Label>
                    <Select
                      value={newContact.customer_id}
                      onValueChange={(value) => setNewContact({ ...newContact, customer_id: value })}
                    >
                      <SelectTrigger className="font-vazir">
                        <SelectValue placeholder="انتخاب شرکت (اختیاری)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">فرد مستقل</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-vazir">نام *</Label>
                      <Input
                        value={newContact.first_name}
                        onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                        className="font-vazir"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">نام خانوادگی *</Label>
                      <Input
                        value={newContact.last_name}
                        onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                        className="font-vazir"
                        required
                      />
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-vazir">سمت</Label>
                      <Input
                        value={newContact.job_title}
                        onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                        className="font-vazir"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">بخش</Label>
                      <Input
                        value={newContact.department}
                        onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                        className="font-vazir"
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-vazir">ایمیل</Label>
                      <Input
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        className="font-vazir"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-vazir">تلفن ثابت</Label>
                        <Input
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                          className="font-vazir"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-vazir">موبایل</Label>
                        <Input
                          value={newContact.mobile}
                          onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                          className="font-vazir"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="space-y-2">
                    <Label className="font-vazir">منبع</Label>
                    <Select
                      value={newContact.source}
                      onValueChange={(value) => setNewContact({ ...newContact, source: value })}
                    >
                      <SelectTrigger className="font-vazir">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">وب‌سایت</SelectItem>
                        <SelectItem value="referral">معرفی</SelectItem>
                        <SelectItem value="social_media">شبکه‌های اجتماعی</SelectItem>
                        <SelectItem value="cold_call">تماس سرد</SelectItem>
                        <SelectItem value="trade_show">نمایشگاه</SelectItem>
                        <SelectItem value="other">سایر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  {/* Social Links */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-vazir">لینکدین</Label>
                      <Input
                        value={newContact.linkedin_url}
                        onChange={(e) => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                        className="font-vazir"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">توییتر</Label>
                      <Input
                        value={newContact.twitter_url}
                        onChange={(e) => setNewContact({ ...newContact, twitter_url: e.target.value })}
                        className="font-vazir"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-vazir">آدرس</Label>
                      <Textarea
                        value={newContact.address}
                        onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                        className="font-vazir"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-vazir">شهر</Label>
                        <Input
                          value={newContact.city}
                          onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                          className="font-vazir"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-vazir">کشور</Label>
                        <Input
                          value={newContact.country}
                          onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                          className="font-vazir"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="font-vazir">یادداشت</Label>
                    <Textarea
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      className="font-vazir"
                      rows={4}
                      placeholder="یادداشت‌های مربوط به این مخاطب..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="font-vazir"
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleCreateContact}
                  className="font-vazir"
                  disabled={!newContact.first_name || !newContact.last_name}
                >
                  افزودن مخاطب
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در مخاطبین..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-vazir"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] font-vazir">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
                <SelectItem value="blocked">مسدود</SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[180px] font-vazir">
                <SelectValue placeholder="شرکت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مخاطبین</SelectItem>
                <SelectItem value="individual">افراد مستقل</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Avatar and Basic Info */}
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.avatar_url} />
                      <AvatarFallback className="font-vazir">
                        {contact.first_name[0]}{contact.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <h3 className="font-semibold font-vazir truncate">
                          {contact.full_name}
                        </h3>
                        {contact.is_primary && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(contact.status)}`}></div>
                      </div>
                      {contact.job_title && (
                        <p className="text-sm text-muted-foreground font-vazir truncate">
                          {contact.job_title}
                        </p>
                      )}
                      {contact.company && (
                        <div className="flex items-center space-x-1 space-x-reverse mt-1">
                          <Building className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-vazir truncate">
                            {contact.company.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {contact.email && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-vazir truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.mobile && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-vazir">{contact.mobile}</span>
                      </div>
                    )}
                    {contact.city && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-vazir">{contact.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Source Badge */}
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs font-vazir ${getSourceBadgeColor(contact.source)}`}>
                      {contact.source === 'website' && 'وب‌سایت'}
                      {contact.source === 'referral' && 'معرفی'}
                      {contact.source === 'social_media' && 'شبکه اجتماعی'}
                      {contact.source === 'cold_call' && 'تماس سرد'}
                      {contact.source === 'trade_show' && 'نمایشگاه'}
                      {contact.source === 'other' && 'سایر'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProfile(contact)}
                      className="font-vazir"
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      نمایش
                    </Button>
                  </div>

                  {/* Social Links */}
                  {(contact.linkedin_url || contact.twitter_url) && (
                    <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t">
                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {contact.twitter_url && (
                        <a
                          href={contact.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredContacts.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold font-vazir">مخاطبی یافت نشد</h3>
              <p className="mt-1 text-muted-foreground font-vazir">
                {searchTerm ? 'هیچ مخاطبی با این جستجو یافت نشد' : 'هنوز مخاطبی اضافه نشده است'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-vazir">افزودن مخاطب جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" className="font-vazir">اطلاعات پایه</TabsTrigger>
                <TabsTrigger value="additional" className="font-vazir">اطلاعات تکمیلی</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Company Selection */}
                <div className="space-y-2">
                  <Label className="font-vazir">شرکت</Label>
                  <Select
                    value={newContact.customer_id}
                    onValueChange={(value) => setNewContact({ ...newContact, customer_id: value })}
                  >
                    <SelectTrigger className="font-vazir">
                      <SelectValue placeholder="انتخاب شرکت (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فرد مستقل</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-vazir">نام *</Label>
                    <Input
                      value={newContact.first_name}
                      onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                      className="font-vazir"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-vazir">نام خانوادگی *</Label>
                    <Input
                      value={newContact.last_name}
                      onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                      className="font-vazir"
                      required
                    />
                  </div>
                </div>

                {/* Job Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-vazir">سمت</Label>
                    <Input
                      value={newContact.job_title}
                      onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                      className="font-vazir"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-vazir">بخش</Label>
                    <Input
                      value={newContact.department}
                      onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                      className="font-vazir"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-vazir">ایمیل</Label>
                    <Input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="font-vazir"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-vazir">تلفن ثابت</Label>
                      <Input
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        className="font-vazir"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">موبایل</Label>
                      <Input
                        value={newContact.mobile}
                        onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                        className="font-vazir"
                      />
                    </div>
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <Label className="font-vazir">منبع آشنایی</Label>
                  <Select value={newContact.source} onValueChange={(value) => setNewContact({ ...newContact, source: value })}>
                    <SelectTrigger className="font-vazir">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">وب‌سایت</SelectItem>
                      <SelectItem value="referral">معرفی</SelectItem>
                      <SelectItem value="social_media">شبکه اجتماعی</SelectItem>
                      <SelectItem value="cold_call">تماس سرد</SelectItem>
                      <SelectItem value="trade_show">نمایشگاه</SelectItem>
                      <SelectItem value="other">سایر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="additional" className="space-y-4">
                {/* Social Links */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-vazir">LinkedIn</Label>
                    <Input
                      value={newContact.linkedin_url}
                      onChange={(e) => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="font-vazir"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-vazir">Twitter</Label>
                    <Input
                      value={newContact.twitter_url}
                      onChange={(e) => setNewContact({ ...newContact, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/..."
                      className="font-vazir"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-vazir">آدرس</Label>
                    <Textarea
                      value={newContact.address}
                      onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                      className="font-vazir"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-vazir">شهر</Label>
                      <Input
                        value={newContact.city}
                        onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                        className="font-vazir"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-vazir">کشور</Label>
                      <Input
                        value={newContact.country}
                        onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                        className="font-vazir"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="font-vazir">یادداشت</Label>
                  <Textarea
                    value={newContact.notes}
                    onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                    placeholder="یادداشت‌های اضافی در مورد این مخاطب..."
                    className="font-vazir"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="font-vazir">
                لغو
              </Button>
              <Button onClick={handleCreateContact} className="font-vazir">
                افزودن مخاطب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {selectedContact && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="font-vazir">پروفایل مخاطب</DialogTitle>
              </DialogHeader>

              {/* Contact Header */}
              <div className="flex items-start space-x-4 space-x-reverse">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedContact.avatar_url} />
                  <AvatarFallback className="text-lg font-vazir">
                    {selectedContact.first_name[0]}{selectedContact.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h2 className="text-xl font-semibold font-vazir">
                      {selectedContact.full_name}
                    </h2>
                    {selectedContact.is_primary && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        مخاطب اصلی
                      </Badge>
                    )}
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedContact.status)}`}></div>
                  </div>
                  {selectedContact.job_title && (
                    <p className="text-muted-foreground font-vazir">
                      {selectedContact.job_title}
                    </p>
                  )}
                  {selectedContact.company && (
                    <div className="flex items-center space-x-2 space-x-reverse mt-1">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground font-vazir">
                        {selectedContact.company.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info" className="font-vazir">اطلاعات</TabsTrigger>
                  <TabsTrigger value="activities" className="font-vazir">فعالیت‌ها</TabsTrigger>
                  <TabsTrigger value="notes" className="font-vazir">یادداشت‌ها</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedContact.email && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-vazir">{selectedContact.email}</span>
                      </div>
                    )}
                    {selectedContact.mobile && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-vazir">{selectedContact.mobile}</span>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-vazir">{selectedContact.phone}</span>
                      </div>
                    )}
                    {selectedContact.city && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-vazir">{selectedContact.city}, {selectedContact.country}</span>
                      </div>
                    )}
                    {selectedContact.department && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-vazir">{selectedContact.department}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <Badge className={getSourceBadgeColor(selectedContact.source)}>
                        {selectedContact.source === 'website' && 'وب‌سایت'}
                        {selectedContact.source === 'referral' && 'معرفی'}
                        {selectedContact.source === 'social_media' && 'شبکه اجتماعی'}
                        {selectedContact.source === 'cold_call' && 'تماس سرد'}
                        {selectedContact.source === 'trade_show' && 'نمایشگاه'}
                        {selectedContact.source === 'other' && 'سایر'}
                      </Badge>
                    </div>
                  </div>

                  {selectedContact.address && (
                    <div className="space-y-2">
                      <Label className="font-vazir">آدرس</Label>
                      <p className="text-sm text-muted-foreground font-vazir">
                        {selectedContact.address}
                      </p>
                    </div>
                  )}

                  {(selectedContact.linkedin_url || selectedContact.twitter_url) && (
                    <div className="space-y-2">
                      <Label className="font-vazir">شبکه‌های اجتماعی</Label>
                      <div className="flex space-x-4 space-x-reverse">
                        {selectedContact.linkedin_url && (
                          <a
                            href={selectedContact.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-800"
                          >
                            <Linkedin className="w-4 h-4" />
                            <span className="text-sm">LinkedIn</span>
                          </a>
                        )}
                        {selectedContact.twitter_url && (
                          <a
                            href={selectedContact.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 space-x-reverse text-blue-400 hover:text-blue-600"
                          >
                            <Twitter className="w-4 h-4" />
                            <span className="text-sm">Twitter</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="space-y-4">
                  {activities.length > 0 ? (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 border rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium font-vazir">{activity.title}</h4>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground font-vazir mt-1">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 space-x-reverse mt-2">
                              <Badge variant="outline" className="text-xs">
                                {activity.activity_type === 'call' && 'تماس'}
                                {activity.activity_type === 'email' && 'ایمیل'}
                                {activity.activity_type === 'meeting' && 'جلسه'}
                                {activity.activity_type === 'note' && 'یادداشت'}
                                {activity.activity_type === 'task' && 'کار'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-semibold font-vazir">فعالیتی ثبت نشده</h3>
                      <p className="mt-1 text-muted-foreground font-vazir">
                        هنوز فعالیتی برای این مخاطب ثبت نشده است
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="یادداشت جدید اضافه کنید..."
                      className="font-vazir"
                    />
                    <Button className="font-vazir">
                      افزودن یادداشت
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}