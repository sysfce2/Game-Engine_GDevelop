/** \file
 *  Game Develop
 *  2008-2013 Florian Rival (Florian.Rival@gmail.com)
 */

#if defined(GD_IDE_ONLY)

#ifndef LOCALEMANAGER_H
#define LOCALEMANAGER_H
#include <wx/intl.h>

namespace gd
{

/**
 * \brief Class allowing to use a common wxLocale object for the IDE as well as for extensions.
 *
 * You may want to use this class if you have a custom translation catalog to add. See LocaleManager::AddCatalog
 *
 * \ingroup Tools
 */
class GD_CORE_API LocaleManager
{
public:
    wxLocale * locale; ///< wxWidgets locale object
    bool SetLanguage(int languageWxWidgetsId);
    
    /**
     * \brief Add a catalog name.
     *
     * If catalog name is GD, then the file must be named GD.mo and located
     * in a search path. ( locale directory for example or xxxPlatform/Extensions/locale ).
     * \param catalogName The name of the translation catalog.
     */
    void AddCatalog(std::string catalogName);

    /**
     * \brief Add a path where catalog are searched. 
     * \param path The path, relative to the Game Develop directory.
     */
    void AddPath(std::string path);

    static LocaleManager *GetInstance()
    {
        if ( !_singleton )
        {
            _singleton = new LocaleManager;
        }

        return ( static_cast<LocaleManager*>( _singleton ) );
    }

    static void DestroySingleton()
    {
        if ( _singleton )
        {
            delete _singleton;
            _singleton = 0;
        }
    }

private:

    LocaleManager() : locale(NULL) {};
    virtual ~LocaleManager() {};

    static LocaleManager *_singleton;
};

}

#endif // LOCALEMANAGER_H
#endif
