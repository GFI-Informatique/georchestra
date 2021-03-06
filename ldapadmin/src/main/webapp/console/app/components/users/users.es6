require('components/users/users.tpl')

require('services/users')
require('services/groups_users')
require('services/logs')
require('services/messages')

class UsersController {

  static $inject = [ '$routeParams', '$injector', 'User', 'Group' ]

  constructor ($routeParams, $injector, User, Group) {
    this.$injector = $injector

    this.q = ''
    this.itemsPerPage = 25

    this.newGroup = this.$injector.get('$location').$$search['new'] === 'group'
    this.newGroupName = ''
    this.delete = this.$injector.get('$location').$$search['delete'] === 'true'
    this.canDelete = false

    this.users = User.query(() => {
      this.allUsers = this.users.slice()
    })

    this.groups = Group.query()
    this.activePromise = this.groups.$promise.then(() => {
      this.activeGroup = this.groups.filter(g => g.cn === $routeParams.id)[0]
      if (this.activeGroup) {
        this.filter(this.activeGroup)
        this.canDelete = !this.$injector.get('groupAdminFilter')(
          this.activeGroup
        )
      }
      return this.activeGroup
    })

    let translate = this.$injector.get('translate')
    this.i18n = {}
    translate('group.created', this.i18n)
    translate('group.updated', this.i18n)
    translate('group.deleted', this.i18n)
    translate('group.error', this.i18n)
    translate('group.deleteError', this.i18n)
  }

  filter (group) {
    this.users.$promise.then(() => {
      this.users = this.allUsers.filter(
        user => (group.users.indexOf(user.uid) >= 0)
      )
    })
  }

  close () {
    this.newGroup = false
    this.newGroupName = ''
    this.delete = false
    let $location = this.$injector.get('$location')
    $location.url($location.path())
  }

  saveGroup () {
    let flash = this.$injector.get('Flash')
    let $router = this.$injector.get('$router')
    let $location = this.$injector.get('$location')
    let $httpDefaultCache = this.$injector.get('$cacheFactory').get('$http')

    let group = new (this.$injector.get('Group'))()
    group.cn = this.newGroupName
    group.description = this.newGroupDesc

    group.$save(
      () => {
        flash.create('success', this.i18n.created)
        $httpDefaultCache.removeAll()
        $router.navigate($router.generate('users', {id: group.cn}))
        $location.url($location.path())
      },
      flash.create.bind(flash, 'danger', this.i18n.error)
    )
  }

  activate ($scope) {
    let $location = this.$injector.get('$location')
    $scope.$watch(() => $location.search()['new'], (v) => {
      this.newGroup = v === 'group'
    })
    $scope.$watch(() => $location.search()['delete'], (v) => {
      this.delete = v === 'true'
    })
  }

  deleteGroup () {
    let $location = this.$injector.get('$location')
    $location.search('delete', 'true')
  }

  confirmDeleteGroup () {
    const flash = this.$injector.get('Flash')
    const $httpDefaultCache = this.$injector.get('$cacheFactory').get('$http')
    const $router = this.$injector.get('$router')
    const $location = this.$injector.get('$location')
    this.activeGroup.$delete(
      () => {
        flash.create('success', this.i18n.deleted)
        $httpDefaultCache.removeAll()
        $router.navigate($router.generate('users', {id: 'all'}))
        $location.url($location.path())
      },
      flash.create.bind(flash, 'danger', this.i18n.deleteError)
    )
  }

  initEditable () {
    let flash = this.$injector.get('Flash')
    let $httpDefaultCache = this.$injector.get('$cacheFactory').get('$http')
    $('.content-description').on('blur', (e) => {
      this.$injector.get('Group').get(
        {id: this.activeGroup.cn},
        (group) => {
          group.description = e.target.innerText
          group.$update(() => {
            $httpDefaultCache.removeAll()
            flash.create('success', this.i18n.updated)
          }, flash.create.bind(flash, 'danger', this.i18n.error))
        }
      )
    })
  }

}

UsersController.prototype.activate.$inject = [ '$scope' ]

angular.module('admin_console')
.controller('UsersController', UsersController)
.directive('validateGroup', () => ({
  require: 'ngModel',
  link: (scope, elm, attrs, ctrl) => {
    ctrl.$validators.validateGroup = (modelValue, viewValue) => {
      let groups = scope.$eval(attrs['validateGroup'])
      let prefix = viewValue.substr(0, viewValue.lastIndexOf('_'))
      return prefix === '' || groups.some(g => g.cn === prefix)
    }
  }
}))
